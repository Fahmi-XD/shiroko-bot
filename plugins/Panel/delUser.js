export default async (handler) => {
  handler.add({
    cmd: await Object.keys(global.panel).map((v, i) => global.panel[v].domain ? `delusrv${i + 1}` : null),
    cats: await Object.keys(global.panel).map((v, i) => global.panel[v].domain ? `Panel V${i + 1}` : null),
    owner: true,
    indexCmd: true,
    args: true,
    typing: true,

    run: async ({ exp }) => {
      await exp.del();
    }
  })

  handler.func(({ exp, sys }) => {
    exp.del = async () => {
      let usr = sys.parseCommand[1];
      const vpanel = global.panel[sys.cmd.match(/(v[0-9]+)/g)[0]];
      if (!usr) return sys.text('> ID nya mana?')
      let f = await fetch(vpanel.domain + "/api/application/users/" + usr, {
          "method": "DELETE",
          "headers": {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": "Bearer " + vpanel.apikey
        }
      })
      let res = f.ok ? { errors: null } : await f.json()
      if (res.errors) return sys.text('> *USER NOT FOUND*');
      sys.text('> *SUCCESSFULLY DELETE THE USER*')
    }
  })
}