export function BrandPanel() {
  return (
    <div 
      className="hidden lg:flex flex-col items-center justify-center bg-cover bg-center rounded-3xl p-12 min-h-125 relative"
      style={{
        backgroundImage: "url('/images/Login.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Optional overlay for better contrast */}
      <div className="absolute inset-0 bg-black/10 rounded-3xl"></div>
    </div>
  )
}