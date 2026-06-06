export default function Footer() {
  return (
    <footer className="w-full border-t border-white/5 bg-[#08090C] py-8 text-center text-sm text-zinc-500 mt-auto">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          &copy; {new Date().getFullYear()} InviteRewards Center. All rights reserved.
        </div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-zinc-300 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-zinc-300 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-[#5865F2] transition-colors">Discord Server</a>
        </div>
      </div>
    </footer>
  );
}
