#!/usr/bin/env node
var Gopigo  = require('node-gopigo').Gopigo
var net     = require('net')
var _       = require('lodash')

var Robot = Gopigo.robot
var ultrasonicPin = 15
var robot = new Robot({
  minVoltage: 5.5,
  criticalVoltage: 1.2,
  debug: true,
  ultrasonicSensorPin: ultrasonicPin,
  //IRReceiverSensorPin: irreceiverPin
})

robot.on('init', function onInit(res) {
  if (res) {
    console.log('GoPiGo Ready!')
  } else {
    console.log('Something went wrong during the init.')
  }
})
robot.on('error', function onError(err) {
  console.log('Something went wrong')
  console.log(err)
})
robot.on('free', function onFree() {
  console.log('GoPiGo is free to go')
})
robot.on('halt', function onHalt() {
  console.log('GoPiGo is halted')
})
robot.on('close', function onClose() {
  console.log('GoPiGo is going to sleep')
})
robot.on('reset', function onReset() {
  console.log('GoPiGo is resetting')
})
robot.on('normalVoltage', function onNormalVoltage(voltage) {
  console.log('Voltage is ok ['+voltage+']')
})
robot.on('lowVoltage', function onLowVoltage(voltage) {
  console.log('(!!) Voltage is low ['+voltage+']')
})
robot.on('criticalVoltage', function onCriticalVoltage(voltage) {
  console.log('(!!!) Voltage is critical ['+voltage+']')
})
robot.init()

var host = process.env.GAMEPADGO_HOST
var port = process.env.GAMEPADGO_PORT

function connect() {
  var socket = net.connect(port, host, function() {
    var ip = socket.address().address
    console.log(`Local address: ${ip}`);
    console.log(`Connected to ${host}:${port}`);
    var data = JSON.stringify({type: 'client_ip', body: ip});
    socket.write(data)
  })

  socket.left = []
  socket.on('readable', function() {
    var chunk = this.read()
    while (true) {
      if (!~chunk.indexOf(String.fromCharCode(0))) {
        break
      }
      this.left.push(chunk)
      var buffer = Buffer.concat(this.left)
      var end = buffer.indexOf(String.fromCharCode(0))
      var command = buffer.slice(0, end)
      this.left = []
      chunk = buffer.slice(end + 1)
      if (!command.length) {
        break
      }
      try {
        var data = JSON.parse(command);
      } catch (e) {
        console.log(e.message);
        console.log(chunk);
        return
      }
      handleGamepad(data)
      console.log(`handled: ${command}`);
    }

    if (chunk.length) {
      //console.log(`left(${chunk.length}): ${chunk}`);
      this.left.push(chunk)
    }
  })

  socket.on('error', console.error)
  socket.on('close', connect)
}
connect()

function handleGamepad(gamepad) {
  if (Math.abs(_.get(gamepad, 'axes.0')) >= Math.abs(_.get(gamepad, 'axes.1'))) {
    _.set(gamepad, 'axes.1', 0)
  } else {
    _.set(gamepad, 'axes.0', 0)
  }
  if (Math.abs(_.get(gamepad, 'axes.0')) < 0.5) {
    _.set(gamepad, 'axes.0', 0)
  }
  if (Math.abs(_.get(gamepad, 'axes.1')) < 0.5) {
    _.set(gamepad, 'axes.1', 0)
  }

  switch (true) {
    case _.get(gamepad, 'buttons.10.value'):
      robot.reset()
    break
    //case 'left led on':
      //var res = robot.ledLeft.on()
      //console.log('Left led on::'+res)
    //break
    //case 'left led off':
      //var res = robot.ledLeft.off()
      //console.log('Left led off::'+res)
    //break
    //case 'right led on':
      //var res = robot.ledRight.on()
      //console.log('Right led on::'+res)
    //break
    //case 'right led off':
      //var res = robot.ledRight.off()
      //console.log('Right led off::'+res)
    //break
    case _.get(gamepad, 'axes.1') < 0:
    case _.get(gamepad, 'axes.9') < -0.9:
      var res = robot.motion.forward(false)
      console.log('Moving forward::' + res)
    break
    case _.get(gamepad, 'axes.1') > 0:
    case 0.1 < _.get(gamepad, 'axes.9') && _.get(gamepad, 'axes.9') < 0.2:
      var res = robot.motion.backward(false)
      console.log('Moving backward::' + res)
    break
    case _.get(gamepad, 'axes.0') < 0:
    case 0.7 < _.get(gamepad, 'axes.9') && _.get(gamepad, 'axes.9') < 0.8:
      var res = robot.motion.left()
      console.log('Turning left::' + res)
    break
    case _.get(gamepad, 'axes.0') > 0:
    case -0.5 < _.get(gamepad, 'axes.9') && _.get(gamepad, 'axes.9') < -0.4:
      var res = robot.motion.right()
      console.log('Turning right::' + res)
    break
    case _.get(gamepad, 'axes.6') > -0.5:
      var res = robot.motion.decreaseSpeed()
      console.log('Decreasing speed::' + res)
    break
    case _.get(gamepad, 'axes.7') > -0.5:
      var res = robot.motion.increaseSpeed()
      console.log('Increasing speed::' + res)
    break
    case _.get(gamepad, 'buttons.0.value') > 0:
      var res = robot.motion.stop()
      console.log('Stop::' + res)
    break
    //case 'increase speed':
    //case 't':
      //var res = robot.motion.increaseSpeed()
      //console.log('Increasing speed::' + res)
    //break
    //case 'decrease speed':
    //case 'g':
      //var res = robot.motion.decreaseSpeed()
      //console.log('Decreasing speed::' + res)
    //break
    //case 'voltage':
    //case 'v':
      //var res = robot.board.getVoltage()
      //console.log('Voltage::' + res + ' V')
    //break
    //case 'servo test':
    //case 'b':
      //robot.servo.move(0)
      //console.log('Servo in position 0')

      //robot.board.wait(1000)
      //robot.servo.move(180)
      //console.log('Servo in position 180')

      //robot.board.wait(1000)
      //robot.servo.move(90)
      //console.log('Servo in position 90')
    //break
    //case 'exit':
    //case 'z':
      //robot.close()
      //process.exit()
    //break
    //case 'ultrasonic distance':
    //case 'u':
      //var res = robot.ultraSonicSensor.getDistance()
      //console.log('Ultrasonic Distance::' + res + ' cm')
    //break
    //case 'ir receive':
      //var res = robot.IRReceiverSensor.read()
      //console.log('IR Receiver data::')
      //console.log(res)
    //break
    //case 'l':
      //// TODO
    //break
    //case 'move forward with pid':
    //case 'i':
      //var res = robot.motion.forward(true)
      //console.log('Moving forward::' + res)
    //break
    //case 'move backward with pid':
    //case 'k':
      //var res = robot.motion.backward(true)
      //console.log('Moving backward::' + res)
    //break
    //case 'rotate left':
    //case 'n':
      //var res = robot.motion.leftWithRotation()
      //console.log('Rotating left::' + res)
    //break
    //case 'rotate right':
    //case 'm':
      //var res = robot.motion.rightWithRotation()
      //console.log('Rotating right::' + res)
    //break
    //case 'set encoder targeting':
    //case 'y':
      //var res = robot.encoders.targeting(1, 1, 18)
      //console.log('Setting encoder targeting:1:1:18::' + res)
    //break
    //case 'firmware version':
    //case 'f':
      //var res = robot.board.version()
      //console.log('Firmware version::' + res)
    //break
    //case 'board revision':
      //var res = robot.board.revision()
      //console.log('Board revision::' + res)
    //break
  }

  //robot.board.wait(1000)
}
