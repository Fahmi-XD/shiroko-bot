import Axios from "axios";

export default (handler) => {
  handler.add({
    cmd: ["claude"],
    cats: ["Artificial Intelligence"],
    typing: true,
    premium: true,

    run: async ({ sys, exp }) => {
      try {
        const userId = sys.sender;
        const userText = sys.nbody;
  
        const result = await exp.ai(userId, userText);
        const output = typeof result === 'object' ? JSON.stringify(result, null, 2) : result;
        sys.text(`> Claude 3.5 Sonnet

${output}`);
      } catch (error) {
        console.error("Error:", error.message);
        sys.text("> Terjadi kesalahan dalam mendapatkan respons.");
      }
    }
  })

  handler.func(async ({ exp }) => {
    exp.ai = async function ai(userid, text,) {
      try {
          const response = await Axios.post('https://luminai.my.id/', {
              content: text,
              user: userid,
              model: "claude-sonnet-3.5"
          });

          return response.data.result;
      } catch (error) {
          console.error("Terjadi kesalahan:", error.message);
          return "Gagal mendapatkan respons dari AI.";
      }
    }
  })
}