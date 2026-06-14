import Footer from '@/components/home/footer'
import Navbar from '@/components/Navbar'

export default function HelpPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-semibold text-slate-900">How BookMandu works</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            BookMandu connects buyers and sellers so you can order books directly from the seller. After placing an order, you will receive the seller's phone number and can contact them to agree on a safe meet-up location.
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Please note that BookMandu is only a platform for matching buyers and sellers. The exchange is completed in person, and all privacy and safety risk is your responsibility. Meet in a public, well-lit place and verify the seller before handing over money or books.
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            If any misbehavior happens during or after the meeting, contact the official BookMandu help centre immediately on <strong>+977 98278 97983</strong>.
          </p>
        </div>

        <div className="grid gap-6 rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm sm:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">Order & connect</h2>
            <p className="text-sm leading-7 text-slate-600">
              1. Browse books and place your order on BookMandu.
            </p>
            <p className="text-sm leading-7 text-slate-600">
              2. Seller will use the phone number provided by you to connect and confirm the details.
            </p>
            <p className="text-sm leading-7 text-slate-600">
              3. Meet in a safe public place, exchange the book, and complete the transaction.
            </p>
            <p className="text-sm leading-7 text-slate-600 font-semibold text-slate-800">
              Remember: BookMandu does not take responsibility for in-person exchanges.
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6">
            <div className="mb-6 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
              Exchange diagram
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-sm">
                  <div className="h-12 w-12 rounded-full bg-indigo-600 text-white grid place-items-center text-sm font-semibold">
                    You
                  </div>
                  <div className="text-sm leading-6 text-slate-700">Contact seller via phone</div>
                </div>
                <div className="mx-auto h-6 w-6 rotate-45 border-l-2 border-b-2 border-slate-400" />
                <div className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-sm">
                  <div className="h-12 w-12 rounded-full bg-emerald-600 text-white grid place-items-center text-sm font-semibold">
                    Seller
                  </div>
                  <div className="text-sm leading-6 text-slate-700">Agree on a safe meetup</div>
                </div>
                <div className="mx-auto h-6 w-6 rotate-45 border-l-2 border-b-2 border-slate-400" />
                <div className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-sm">
                  <div className="h-12 w-12 rounded-full bg-slate-700 text-white grid place-items-center text-sm font-semibold">
                    Exchange
                  </div>
                  <div className="text-sm leading-6 text-slate-700">Meet & hand over the book</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Need help?</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            If the buyer or seller behaves badly, or if you feel unsafe at any point, contact the official BookMandu help centre right away.
          </p>
          <p className="mt-4 text-sm font-semibold text-slate-700">
            Help centre phone: <a href="tel:+9779827897983" className="text-indigo-600 hover:text-indigo-800">+977 98278 97983</a>
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            BookMandu cannot be held responsible for third-party conduct during in-person meetings. Always choose a public meeting location and prioritize your safety.
          </p>
          <div className="mt-6 rounded-3xl bg-indigo-50 p-4 text-sm text-indigo-700">
            <strong>Safety reminder:</strong> Meet in busy public places only. Do not share extra personal data. If you are unsure, cancel the meetup and contact support.
          </div>
        </div>
      </div>
    </main>
    <Footer/>
        </>

  )
}