import * as line from '@line/bot-sdk';
import {PomodoroManager} from "./ServiceManager"
import express from "express"

const config = {
  channelAccessToken: 'Your-Access-Token',
  channelSecret: 'Your-Secret'
};

const pomodoroManager = new PomodoroManager()

interface LineRequest extends express.Request{
  body: line.WebhookRequestBody
}

const app = express();
app.post('/webhook', line.middleware(config), (req: LineRequest, res: express.Response) => {
  console.log(req.body.events)
  Promise.all(req.body.events.filter((e)=>e.type === "message" && e.message.type === "text").map(handlePomodoro)).then(result=>res.json(result))
});

const client = new line.Client(config);

const handlePomodoro = async (msgEvent: line.MessageEvent) => {
  const txtEvent = msgEvent.message as line.TextEventMessage
  const initializer = msgEvent.source.userId
  const pomodoroExists = pomodoroManager.ongoingUnits.includes(initializer)
  console.log(pomodoroManager.ongoingUnits)
  if (!initializer) {
    return client.replyMessage(msgEvent.replyToken, {type: "text", text: "Cannot get userId"})
  }

  if (txtEvent.text === "pomodoro-start") {
    if (pomodoroExists) {
      return client.replyMessage(msgEvent.replyToken, {type: "text", text: "You already have existing pomodoro"})
    }
    client.replyMessage(msgEvent.replyToken, {type: "text", text: "Started pomodoro service"})
    
    client.pushMessage(msgEvent.source.type === "group"? msgEvent.source.groupId : msgEvent.source.userId, {type: "text", text: "Concentrate on task for 25 mins"})
    setTimeout(()=>{
      client.pushMessage(msgEvent.source.type === "group"? msgEvent.source.groupId : msgEvent.source.userId, {type: "text", text: "Take a 5 mins' break"})
    }, 25 * 60 * 1000)
    const timer = setInterval(()=>{
      client.pushMessage(msgEvent.source.type === "group"? msgEvent.source.groupId : msgEvent.source.userId, {type: "text", text: "Concentrate on task for 25 mins"})
      setTimeout(()=>{
        client.pushMessage(msgEvent.source.type === "group"? msgEvent.source.groupId : msgEvent.source.userId, {type: "text", text: "Take a 5 mins' break"})
      }, 25 * 60 * 1000)
    }, 30 * 60 * 1000)
    pomodoroManager.addUnit(initializer, timer)
  }

  if (txtEvent.text === "pomodoro-stop" ) {
    if (!pomodoroExists) {
      return client.replyMessage(msgEvent.replyToken, {type: "text", text: "You do not have existing pomodoro to stop"})
    }
    const result = pomodoroManager.removeUnit(initializer)
    client.replyMessage(msgEvent.replyToken, {type: "text", text: result ? "Stoped pomodoro service" : "Failed stoping pomodoro service"})
  }
}

app.listen(3005, ()=> {console.log("Listening to port 3005")});