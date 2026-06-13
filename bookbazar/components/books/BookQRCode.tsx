'use client'

import { useEffect, useState } from "react"
import { useQRCode } from "next-qrcode"

interface BookQRCodeProps {
  path: string
}

export default function BookQRCode({ path }: BookQRCodeProps) {
  const [href, setHref] = useState("")
  const { SVG } = useQRCode()

  useEffect(() => {
    setHref(`${window.location.origin}${path}`)
  }, [path])

  if (!href) return null

  const shareText = `Check out this book: ${href}`
  const whatsappLink = `https://wa.me/?text=${encodeURIComponent(shareText)}`
  const messengerLink = `fb-messenger://share?link=${encodeURIComponent(href)}`

  return (
    <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="mb-4 text-sm font-semibold text-slate-600">Share this book</p>
      <SVG
        text={href}
        options={{
          margin: 2,
          width: 200,
          color: {
            dark: '#010599FF',
            light: '#FFBF60FF',
          },
        }}
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <a
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-2xl border border-green-500 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-100"
        >
          Share via WhatsApp
        </a>
        <a
          href={messengerLink}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-2xl border border-blue-500 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
        >
          Share via Messenger
        </a>
      </div>
    </div>
  )
}
