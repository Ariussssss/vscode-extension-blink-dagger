import os from 'os'
import fs from 'fs'
import path from 'path'
import mkdirp from 'mkdirp'

export const homedir = os.homedir()

export const ifDirExist = (dir: string) => {
  return fs.existsSync(dir)
}

export const isDir = (dir: string) => {
  return ifDirExist(dir) && fs.lstatSync(dir).isDirectory()
}

export const isFile = (filePath: string) => {
  return ifDirExist(filePath) && fs.lstatSync(filePath).isFile()
}

export const getPwd = (subDir: string, runtime = false) => {
  return path.resolve(runtime ? process.cwd() : __dirname, subDir)
}

export const getPwdRelativeProject = (subDir: string, runtime = false) => {
  return path.resolve(
    runtime ? process.cwd() : path.resolve(__dirname, '../'),
    subDir
  )
}

export const getBasename = (dir: string) => {
  return path.basename(dir)
}

export const copyFileSync = (source: string, target: string) => {
  let targetFile = target
  if (fs.existsSync(target)) {
    if (fs.lstatSync(target).isDirectory()) {
      targetFile = path.join(target, path.basename(source))
    }
  }
  fs.writeFileSync(targetFile, fs.readFileSync(source))
  return targetFile
}

export const isRelativePath = (filePath: string) => /^\.\//.test(filePath)

export const isAbsolutePath = (filePath: string) => /^\//.test(filePath)

export const ensurePath = (dirName: string) => {
  if (!ifDirExist(dirName)) {
    mkdirp.sync(dirName)
  }
}
