import sharp from "sharp"
import fs from "fs"
import path from "path"

// Try multiple possible paths
const possibleRoots = [
  "/vercel/share/v0-project",
  "/home/user/v0-project",
  process.cwd(),
]

let dir = null
for (const root of possibleRoots) {
  const candidate = path.join(root, "public", "icons", "markets")
  console.log("Trying:", candidate, "exists:", fs.existsSync(candidate))
  if (fs.existsSync(candidate)) {
    dir = candidate
    break
  }
}

// Also try finding it by walking up
if (!dir) {
  // List what we can see
  console.log("CWD:", process.cwd())
  console.log("CWD contents:", fs.readdirSync(process.cwd()))
  try { console.log("/vercel contents:", fs.readdirSync("/vercel")) } catch(e) { console.log("/vercel not accessible") }
  try { console.log("/home/user contents:", fs.readdirSync("/home/user")) } catch(e) { console.log("/home/user not accessible") }
}

if (dir) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".jpg"))
  console.log("Found", files.length, "JPG files")
  
  for (const file of files) {
    const input = path.join(dir, file)
    const output = path.join(dir, file.replace(".jpg", ".webp"))
    await sharp(input)
      .resize(64, 64, { fit: "cover" })
      .webp({ quality: 75 })
      .toFile(output)
    fs.unlinkSync(input)
    console.log(`Converted: ${file} -> ${file.replace(".jpg", ".webp")}`)
  }
  console.log("Done!")
} else {
  console.log("Could not find icons directory")
}
