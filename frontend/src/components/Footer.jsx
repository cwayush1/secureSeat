// src/components/Footer.jsx

const TwitterIcon = () => (
  <svg
    className="w-5 h-5"
    fill="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
  </svg>
);

const GitHubIcon = () => (
  <svg
    className="w-5 h-5"
    fill="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      clipRule="evenodd"
    />
  </svg>
);

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 font-['Inter',sans-serif]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        {/* Top Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-12">
          {/* Brand & Description */}
          <div className="lg:col-span-1">
            <a
              href="/"
              className="flex items-center gap-3 text-2xl font-extrabold text-white tracking-tight no-underline mb-4"
            >
              <span className="text-blue-500 text-3xl">🎫</span>
              Secure<span className="text-blue-500">Seat</span>
            </a>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 pr-4">
              The premium destination for live sports ticketing. Interactive
              stadium layouts, real-time availability, and secure checkout.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="text-slate-400 hover:text-white transition-colors"
              >
                <span className="sr-only">Twitter</span>
                <TwitterIcon />
              </a>
              <a
                href="#"
                className="text-slate-400 hover:text-white transition-colors"
              >
                <span className="sr-only">GitHub</span>
                <GitHubIcon />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold tracking-wide mb-5 uppercase text-sm">
              Explore
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="/"
                  className="text-slate-400 hover:text-blue-400 transition-colors text-sm"
                >
                  Upcoming Matches
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-slate-400 hover:text-blue-400 transition-colors text-sm"
                >
                  Stadium Directory
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-slate-400 hover:text-blue-400 transition-colors text-sm"
                >
                  VIP Experiences
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-slate-400 hover:text-blue-400 transition-colors text-sm"
                >
                  Corporate Bookings
                </a>
              </li>
            </ul>
          </div>

          {/* User Section */}
          <div>
            <h3 className="text-white font-semibold tracking-wide mb-5 uppercase text-sm">
              Your Account
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="/my-tickets"
                  className="text-slate-400 hover:text-blue-400 transition-colors text-sm"
                >
                  My Tickets
                </a>
              </li>
              <li>
                <a
                  href="/login"
                  className="text-slate-400 hover:text-blue-400 transition-colors text-sm"
                >
                  Sign In / Register
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-slate-400 hover:text-blue-400 transition-colors text-sm"
                >
                  Payment Methods
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-slate-400 hover:text-blue-400 transition-colors text-sm"
                >
                  Help Center
                </a>
              </li>
            </ul>
          </div>

          {/* Contact / Newsletter */}
          <div>
            <h3 className="text-white font-semibold tracking-wide mb-5 uppercase text-sm">
              Stay Updated
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Subscribe to get alerts for new matches and exclusive presales.
            </p>
            <form className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                required
              />
              <button
                type="button"
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg px-4 py-2.5 transition-colors text-sm whitespace-nowrap cursor-pointer"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Border Section */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} SecureSeat. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-slate-300 transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-slate-300 transition-colors">
              Cookie Settings
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
