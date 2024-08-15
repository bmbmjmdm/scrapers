const accountSid = ""
const authToken = ""
const client = require('twilio')(accountSid, authToken);
global.fetch = require("node-fetch")

const interv = setInterval(async () => {
  try {
    const results = await fetch("https://www.ebay.com/sch/i.html?_from=R40&_nkw=XC+3060&_sacat=0&LH_BIN=1&_sop=10")
    let doc = await results.text()
    doc = doc.substr(doc.indexOf("results for"))
    let regex = /<span class=s-item__price>\$(.*?)<\/span>/g
    let matches = doc.matchAll(regex)
    let count = 0
    let lowest = 99999
    for (let i of matches) {
      count++
      try {
        const num = new Number(i[1])
        if (num < lowest) lowest = num
        if (num !== NaN && num <= 650 && num >= 400) {
          client.messages
          .create({body: 'Good price: ' + num, from: '+19203156839', to: '+15183507313'})
          .then(message => console.log(message.sid))
          .catch(message => console.log(message))
          clearInterval(interv)
        }
      }
      catch (e) {}
    }
    if (count === 0) {
      console.log(doc)
      client.messages
      .create({body: 'Script broken', from: '+19203156839', to: '+15183507313'})
      .then(message => console.log(message.sid))
      .catch(message => console.log(message))
      clearInterval(interv)
    }
    console.log(lowest)
  }
  catch (e) {
    console.log(e)
    client.messages
    .create({body: 'Script broken', from: '+19203156839', to: '+15183507313'})
    .then(message => console.log(message.sid))
    .catch(message => console.log(message))
    clearInterval(interv)
  }
}, 15000)