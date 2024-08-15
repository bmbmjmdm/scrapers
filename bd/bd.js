const accountSid = ""
const authToken = ""
const client = require('twilio')(accountSid, authToken);
global.fetch = require("node-fetch")
const https = require('https');
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

const redditURL1 = "https://gateway.reddit.com/desktopapi/v1/subreddits/REDACTED?rtj=only&redditWebClient=web2x&app=web2x-client-production&allow_over18=1&include=prefsSubreddit&sort=new&layout=card"
const redditURL2 = "https://gateway.reddit.com/desktopapi/v1/subreddits/REDACTED?rtj=only&redditWebClient=web2x&app=web2x-client-production&allow_over18=1&include=prefsSubreddit&sort=new&layout=card"
const redditURL3 = "https://gateway.reddit.com/desktopapi/v1/subreddits/REDACTED?rtj=only&redditWebClient=web2x&app=web2x-client-production&allow_over18=1&include=prefsSubreddit&sort=new&layout=card"
const redditURL4 = "https://gateway.reddit.com/desktopapi/v1/subreddits/REDACTED?rtj=only&redditWebClient=web2x&app=web2x-client-production&allow_over18=1&include=prefsSubreddit&sort=new&layout=card"
const bdURL = "https://REDACTED.com/api/REDACTED?type[]=ready_made&type[]=flop&price[min]=0&price[max]=300&sizes[]=8&sort[field]=price&skus[]=REDACTED&=&sort[direction]=asc&page=1&limit=60"
const hoardURL = "https://REDACTED.com/forums/for-sale.11/"
let doneReset = 0

const sendMessage = (message) => {
  client.messages
  .create({body: message, from: '+19207862649', to: '+4794451627'})
  .then(message => {
    console.log(message.sid)
    doneReset = 240
  })
  .catch(e => {
    console.log(e)
    doneReset = 240
  })
}

setInterval(async () => {
  if (doneReset) {
    doneReset--
    return 
  }

  try {
    const asyncBDCall = async () => {
      const bdRawData = await fetch(bdURL)
      const bdJSON = JSON.parse(await bdRawData.text())
      if (bdJSON.toys.length) {
        return sendMessage("REDACTED has it: REDACTED")
      }
    }
    asyncBDCall()

    const asynRedditCall1 = async () => {
      const redditRawData = await fetch(redditURL1)
      const redditJSON = JSON.parse(await redditRawData.text())
      const redditPosts = Object.values(redditJSON.posts)
      for (const i of redditPosts) {
        if (i.title.toLowerCase().includes("REDACTED") && i.title.toLowerCase().includes("REDACTED") && i.author !== "REDACTED") {
          return sendMessage("reddit usedsextoys has it")
        }
      }
    }
    asynRedditCall1()
    const asynRedditCall2 = async () => {
      const redditRawData = await fetch(redditURL2)
      const redditJSON = JSON.parse(await redditRawData.text())
      const redditPosts = Object.values(redditJSON.posts)
      for (const i of redditPosts) {
        if (i.title.toLowerCase().includes("REDACTED") && i.title.toLowerCase().includes("REDACTED") && i.author !== "REDACTED") {
          return sendMessage("reddit REDACTED has it")
        }
      }
    }
    asynRedditCall2()
    const asynRedditCall3 = async () => {
      const redditRawData = await fetch(redditURL3)
      const redditJSON = JSON.parse(await redditRawData.text())
      const redditPosts = Object.values(redditJSON.posts)
      for (const i of redditPosts) {
        if (i.title.toLowerCase().includes("REDACTED") && i.title.toLowerCase().includes("REDACTED") && i.author !== "REDACTED") {
          return sendMessage("reddit REDACTED has it")
        }
      }
    }
    asynRedditCall3()
    const asynRedditCall4 = async () => {
      const redditRawData = await fetch(redditURL4)
      const redditJSON = JSON.parse(await redditRawData.text())
      const redditPosts = Object.values(redditJSON.posts)
      for (const i of redditPosts) {
        if (i.title.toLowerCase().includes("REDACTED") && i.title.toLowerCase().includes("REDACTED") && i.author !== "REDACTED") {
          return sendMessage("reddit REDACTED has it")
        }
      }
    }
    asynRedditCall4()

    /*
    const hoardRawData = await fetch(hoardURL, {
      agent: httpsAgent,
    })
    const hoardText = await hoardRawData.text()
    if (hoardText.toLowerCase().includes("REDACTED")) {
      return sendMessage("hoard")
    }
  */
  }
  catch (e) {
    console.log("Error")
    console.log(e)
  }
  console.log("nothing yet")
}, 15000)