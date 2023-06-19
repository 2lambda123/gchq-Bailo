import { createHash, X509Certificate } from 'crypto'
import { readFile } from 'fs/promises'
import jwt from 'jsonwebtoken'
import { stringify as uuidStringify, v4 as uuidv4 } from 'uuid'

import { ModelId } from '../common/types/types.js'
import config from '../common/utils/config.js'

let adminToken: string | undefined

export async function getAdminToken() {
  if (!adminToken) {
    const key = await getPrivateKey()
    const hash = createHash('sha256').update(key).digest().slice(0, 16)
    // eslint-disable-next-line no-bitwise
    hash[6] = (hash[6] & 0x0f) | 0x40
    // eslint-disable-next-line no-bitwise
    hash[8] = (hash[8] & 0x3f) | 0x80

    adminToken = uuidStringify(hash)
  }

  return adminToken
}

async function getPrivateKey() {
  return readFile(config.app.privateKey, { encoding: 'utf-8' })
}

async function getPublicKey() {
  return readFile(config.app.publicKey, { encoding: 'utf-8' })
}

function getBit(buffer: Buffer, index: number) {
  // eslint-disable-next-line no-bitwise
  const byte = ~~(index / 8)
  const bit = index % 8
  const idByte = buffer[byte]
  // eslint-disable-next-line no-bitwise
  return Number((idByte & (2 ** (7 - bit))) !== 0)
}

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
function formatKid(keyBuffer: Buffer) {
  const bitLength = keyBuffer.length * 8

  if (bitLength % 40 !== 0) {
    throw new Error('Invalid bitLength provided, expected multiple of 40')
  }

  let output = ''
  for (let i = 0; i < bitLength; i += 5) {
    let idx = 0
    for (let j = 0; j < 5; j += 1) {
      // eslint-disable-next-line no-bitwise
      idx <<= 1
      idx += getBit(keyBuffer, i + j)
    }
    output += alphabet[idx]
  }

  const match = output.match(/.{1,4}/g)
  if (match === null) {
    throw new Error('KeyBuffer format failed, match did not find any sections.')
  }

  return match.join(':')
}

async function getKid() {
  const cert = new X509Certificate(await getPublicKey())
  const der = cert.publicKey.export({ format: 'der', type: 'spki' })
  const hash = createHash('sha256').update(der).digest().slice(0, 30)

  return formatKid(hash)
}

async function encodeToken<T extends object>(data: T, { expiresIn }: { expiresIn: string }) {
  const privateKey = await getPrivateKey()

  return jwt.sign(
    {
      ...data,
      jti: uuidv4(),
    },
    privateKey,
    {
      algorithm: 'RS256',
      expiresIn,

      audience: config.registry.service,
      issuer: config.registry.issuer,

      header: {
        kid: await getKid(),
        alg: 'RS256',
      },
    }
  )
}

export type Action = 'push' | 'pull' | 'delete' | '*'

export interface Access {
  type: string
  name: string
  class?: string
  actions: Array<Action>
}

export interface User {
  _id: ModelId
  id: string
}

export function getAccessToken(user: User, access: Array<Access>) {
  return encodeToken(
    {
      sub: user.id,
      user: String(user._id),
      access,
    },
    {
      expiresIn: '1 hour',
    }
  )
}
