import config from "../settings/config.js";

import fs from "fs";
import Crypto from "crypto";
import ff from "fluent-ffmpeg";
import webp from "node-webpmux";
import path from "path";
import axios from "axios";
import * as cheerio from "cheerio";
import FormData from "form-data";

async function imageToWebp(media) {
    const tmpFileOut = path.join(process.cwd(), "src/temps", `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
    const tmpFileIn = path.join(process.cwd(), "src/temps", `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.jpg`);

    fs.writeFileSync(tmpFileIn, media);

    await new Promise((resolve, reject) => {
        ff(tmpFileIn)
            .on("error", reject)
            .on("end", () => resolve(true))
            //.addOutputOptions([`-vcodec`,`libwebp`,`-vf`,`scale=512:512:force_original_aspect_ratio=increase,fps=15,crop=512:512`]).toFormat('webp').save(tmpFileOut)
            .addOutputOptions([
                "-vcodec",
                "libwebp",
                "-vf",
                "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse",
            ])
            .toFormat("webp")
            .save(tmpFileOut);
    });

    const buff = fs.readFileSync(tmpFileOut);
    fs.promises.unlink(tmpFileOut);
    fs.promises.unlink(tmpFileIn);
    return buff;
}

async function videoToWebp(media) {
    const tmpFileOut = path.join(process.cwd(), "src/temps", `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
    const tmpFileIn = path.join(process.cwd(), "src/temps", `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.mp4`);

    fs.writeFileSync(tmpFileIn, media);

    await new Promise((resolve, reject) => {
        ff(tmpFileIn)
            .on("error", reject)
            .on("end", () => resolve(true))
            //.addOutputOptions([`-vcodec`,`libwebp`,`-vf`,`scale=512:512:force_original_aspect_ratio=increase,fps=15,crop=512:512`]).toFormat('webp').save(tmpFileOut)
            .addOutputOptions([
                "-vcodec",
                "libwebp",
                "-vf",
                // eslint-disable-next-line no-useless-escape
                "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse",
                "-loop",
                "0",
                "-ss",
                "00:00:00.0",
                "-t",
                "00:00:05.0",
                "-preset",
                "default",
                "-an",
                "-vsync",
                "0",
            ])
            .toFormat("webp")
            .save(tmpFileOut);
    });

    const buff = fs.readFileSync(tmpFileOut);
    fs.promises.unlink(tmpFileOut);
    fs.promises.unlink(tmpFileIn);
    return buff;
}

async function writeExif(media, metadata) {
    let wMedia = /webp/.test(media.mimetype)
        ? media.data
        : /image/.test(media.mimetype)
          ? await imageToWebp(media.data)
          : /video/.test(media.mimetype)
            ? await videoToWebp(media.data)
            : "";
    const tmpFileOut = path.join(process.cwd(), "src/temps", `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
    const tmpFileIn = path.join(process.cwd(), "src/temps", `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(30)}.webp`);
    fs.writeFileSync(tmpFileIn, wMedia);
    if (Object.keys(metadata || "{}").length != 0 || Object.keys(config?.exif).length != 0) {
        const img = new webp.Image();
        let opt = {
            packId: metadata?.packId ? metadata.packId : config?.exif?.packId,
            packName: metadata?.packName ? metadata.packName : config?.exif?.packName,
            packPublish: metadata?.packPublish ? metadata.packPublish : config?.exif?.packPublish,
            packEmail: metadata?.packEmail ? metadata.packEmail : config?.exif?.packEmail,
            packWebsite: metadata?.packWebsite ? metadata.packWebsite : config?.exif?.packWebsite,
            androidApp: metadata?.androidApp ? metadata.androidApp : config?.exif?.androidApp,
            iOSApp: metadata?.iOSApp ? metadata.iOSApp : config?.exif?.iOSApp,
            emojis: metadata?.emojis ? metadata.emojis : config?.exif?.emojis,
            isAvatar: metadata?.isAvatar ? metadata.isAvatar : config?.exif?.isAvatar,
        };
        const json = {
            "sticker-pack-id": opt.packId,
            "sticker-pack-name": opt.packName,
            "sticker-pack-publisher": opt.packPublish,
            "sticker-pack-publisher-email": opt.packEmail,
            "sticker-pack-publisher-website": opt.packWebsite,
            "android-app-store-link": opt.androidApp,
            "ios-app-store-link": opt.iOSApp,
            emojis: opt.emojis,
            "is-avatar-sticker": opt.isAvatar,
        };
        
        const exifAttr = Buffer.from([
            0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
        ]);
        const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8");
        const exif = Buffer.concat([exifAttr, jsonBuff]);
        exif.writeUIntLE(jsonBuff.length, 14, 4);
        await img.load(tmpFileIn);
        fs.promises.unlink(tmpFileIn);
        img.exif = exif;
        await img.save(tmpFileOut);
        return tmpFileOut;
    }
}

function webp2mp4File(source) {
    return new Promise((resolve, reject) => {
        const form = new FormData();
        let isUrl = typeof source === "string" && /https?:\/\//.test(source);
        form.append("new-image-url", isUrl ? source : "");
        form.append("new-image", isUrl ? "" : source, Date.now() + "-image.webp");
        axios({
            method: "post",
            url: "https://s6.ezgif.com/webp-to-mp4",
            data: form,
            headers: {
                "Content-Type": `multipart/form-data; boundary=${form._boundary}`,
            },
        })
            .then(({ data }) => {
                const bodyFormThen = new FormData();
                const $ = cheerio.load(data);
                const file = $('input[name="file"]').attr("value");
                const token = $('input[name="token"]').attr("value");
                const convert = $('input[name="file"]').attr("value");

                bodyFormThen.append("file", file);
                bodyFormThen.append("convert", "Convert WebP to MP4!");
                axios({
                    method: "post",
                    url: "https://ezgif.com/webp-to-mp4/" + file,
                    data: bodyFormThen,
                    headers: {
                        "Content-Type": `multipart/form-data; boundary=${bodyFormThen._boundary}`,
                    },
                })
                    .then(({ data }) => {
                        const $ = cheerio.load(data);
                        const result = "https:" + $("div#output > p.outfile > video > source").attr("src");
                        resolve(result);
                    })
                    .catch(reject);
            })
            .catch(reject);
    });
}

export { imageToWebp, videoToWebp, writeExif, webp2mp4File };
