global.fetch = require("node-fetch")
global.fs = require("fs")

const asyncFun = async () => {
  fs.readFile("./wordList.json", 'utf8',  async (err, data) => {
    let count = 0;
    let list = JSON.parse(data)
    let canContinue = true;
    if (!list.length) return
    while(true) {
      try {
        const results = await fetch("https://www.thewordfinder.com/random-word-generator/", {
          "credentials": "include",
          "headers": {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:96.0) Gecko/20100101 Firefox/96.0",
              "Accept": "*/*",
              "Accept-Language": "en-US,en;q=0.5",
              "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
              "X-Requested-With": "XMLHttpRequest",
              "Sec-Fetch-Dest": "empty",
              "Sec-Fetch-Mode": "cors",
              "Sec-Fetch-Site": "same-origin"
          },
          "referrer": "https://www.thewordfinder.com/random-word-generator/",
          "body": "category%5B%5D=all&category%5B%5D=v&category%5B%5D=n&category%5B%5D=j&category%5B%5D=other&category%5B%5D=places&word_count=100&starts=&contains=&ends=&pattern=&word_len_operator=%3D&word_length=&word_syl_operator=%3D&word_syllables=&subset=all&action=generate",
          "method": "POST",
          "mode": "cors"
        });
        count++
        const doc = await results.text()
        const regex = /<\/i>(.*?)<\/a>/g
        const matches = doc.matchAll(regex)
        for (const i of matches) {
          list.push(i[1])
        }
        if (count % 100 == 0 && canContinue) {
          list = [...new Set(list)];
          console.log("writing " + list.length + " words")
          canContinue = false
          fs.writeFile("./wordList.json", JSON.stringify(list), 'utf8', () => canContinue = true)
        }
        if (count > 10000) {
          console.log("done")
          return
        }
      }
      catch (e) {
        console.log(e)
        return
      }
    }
  })
}

asyncFun()