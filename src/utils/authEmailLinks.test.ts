import { describe, expect, it, vi } from 'vitest'
import type { ActionCodeSettings } from 'firebase/auth'
import { authContinueUrl, sendWithContinueUrl } from './authEmailLinks'

const refused = (code: string) => Object.assign(new Error(code), { code })

describe('links in auth emails', () => {
    it('points at the site the page is served from', () =>
        expect(authContinueUrl('/auth/login', 'https://whossy.com')).toBe('https://whossy.com/auth/login'))

    it('sends with the continue URL when Firebase accepts it', async () => {
        const send = vi.fn(async (_settings?: ActionCodeSettings) => 'ok')
        await expect(sendWithContinueUrl(send, '/auth/login', 'https://whossy.com')).resolves.toBe('ok')
        expect(send).toHaveBeenCalledTimes(1)
        expect(send).toHaveBeenCalledWith({ url: 'https://whossy.com/auth/login' })
    })

    it('sends without one when the domain is not authorized', async () => {
        const send = vi.fn(async (settings?: ActionCodeSettings) => {
            if (settings) throw refused('auth/unauthorized-continue-uri')
            return 'ok'
        })
        await expect(sendWithContinueUrl(send, '/auth/login', 'https://preview.example')).resolves.toBe('ok')
        expect(send).toHaveBeenLastCalledWith(undefined)
    })

    it('passes any other error on, without sending twice', async () => {
        const send = vi.fn(async () => { throw refused('auth/too-many-requests') })
        await expect(sendWithContinueUrl(send, '/auth/login', 'https://whossy.com')).rejects.toMatchObject({ code: 'auth/too-many-requests' })
        expect(send).toHaveBeenCalledTimes(1)
    })
})
