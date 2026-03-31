// src/Components/UI/Footer.jsx
export default function Footer() {
  return (
    <footer className="bg-surface-container-highest py-20 px-6 sm:px-12 mt-24">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        <div>
          <h2 className="font-display text-2xl mb-4 text-primary">Shoply</h2>
          <p className="font-body text-on-surface-variant max-w-sm">
            Shoply marketplace. Discover products from trusted sellers with a clean, modern experience.
          </p>
        </div>
        
        <div className="flex flex-col space-y-3">
          <h3 className="font-body font-semibold text-primary uppercase tracking-widest text-sm mb-2">Explore</h3>
          <a href="#" className="text-on-surface-variant hover:text-secondary transition-colors">Hotline</a>
          <a href="#" className="text-on-surface-variant hover:text-secondary transition-colors">Email</a>
          <a href="#" className="text-on-surface-variant hover:text-secondary transition-colors">Feedback</a>
        </div>
        
        <div>
          <h3 className="font-body font-semibold text-primary uppercase tracking-widest text-sm mb-2">Newsletter</h3>
          <p className="text-on-surface-variant mb-4">Join our mailing list for exclusive previews.</p>
          <div className="flex">
            <input 
              type="email" 
              placeholder="Email address" 
              className="bg-transparent border-b border-outline-variant w-full py-2 text-primary focus:border-secondary focus:outline-none transition-colors"
            />
            <button className="uppercase font-semibold text-primary border-b border-primary hover:text-secondary hover:border-secondary ml-4 transition-colors shrink-0">
              Subscribe
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-[1440px] mx-auto mt-20 pt-8 border-t border-outline-variant/30 flex flex-col sm:flex-row justify-between items-center text-sm text-on-surface-variant">
        <p>(c) {new Date().getFullYear()} Shoply. All rights reserved.</p>
        <div className="flex space-x-6 mt-4 sm:mt-0">
          <a href="#" className="hover:text-primary transition-colors">Privacy</a>
          <a href="#" className="hover:text-primary transition-colors">Terms</a>
        </div>
      </div>
    </footer>
  );
}

