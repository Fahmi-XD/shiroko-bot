const axios = require("axios")
const cheerio = require("cheerio")

/**
 * cmd: Command
 * sys: Object ( sys.text(), sys.image(), sys.document(), sys.product() ) Untuk mengirim pesan
 * sock: socket baileys
 * m: Object serialize
 * pushName: nama sender
 * opt: Function setingan dari case ini, mirip dengan type plugin
 * config: mengambil config dari config.js
 * message: mengambil message dari message.js
 * ...dll
*/

module.exports = async ({ cmd, opt, system, config }) => {
  const { sock, sys, m, sender, pushName } = system;

  switch (cmd) {

    case "genshin": {
      opt({
        cats: ["Game"],
        premium: true,
      })
      const nama = m.args[0];
      if (!nama) return sys.text("Nama?")

      // send text
      sys.text("Bukankah ini my istri")
    }
      break;

    case "ml": {
      opt({
        cats: ["Game"],
        premium: true,
      })
      const nama = m.args[0];
      if (!nama) return sys.text("Nama?")

      // send text
      sys.text("Bukankah ini my istri")
    }
      break;

  }
}