# 🎨 TrustCircle Logo Guide

## Logo Variations

### 1. **Main Logo** (`logo.svg`)
- **Size**: 200x200px
- **Use**: Primary branding, hero sections, large displays
- **Features**: Animated trust nodes, gradient effects, shield with checkmark
- **Background**: Transparent (works on dark backgrounds)

### 2. **Simple Logo** (`logo-simple.svg`)
- **Size**: 64x64px  
- **Use**: Favicons, small icons, mobile apps
- **Features**: Clean, minimal design, trust nodes
- **Background**: Transparent

### 3. **Horizontal Logo** (`logo-horizontal.svg`)
- **Size**: 300x80px
- **Use**: Headers, navigation bars, business cards
- **Features**: Logo + text combination
- **Text**: "TrustCircle" + "Bot-Free Crypto Social Network"

### 4. **Dark Logo** (`logo-dark.svg`)
- **Size**: 200x200px
- **Use**: Light backgrounds, print materials
- **Features**: Dark background with bright accents
- **Background**: Dark gradient fill

## Design Elements

### **Color Palette**
- **Primary Green**: `#4fffb0` (Trust/Security)
- **Blue**: `#38bdf8` (Technology/Blockchain)  
- **Purple**: `#8b5cf6` (AI/Innovation)
- **Orange**: `#ff6b35` (Community/Energy)
- **Dark**: `#1a1a2e` (Background/Contrast)

### **Symbolism**
- **Circle**: Trust network, community, connection
- **Shield**: Security, protection, safety
- **Checkmark**: Verification, authenticity, approval
- **Trust Nodes**: Network participants, decentralization
- **Gradient**: Technology, innovation, future

### **Typography**
- **Primary**: Syne (Bold, modern, tech-forward)
- **Secondary**: DM Mono (Code, technical, precise)

## Usage Guidelines

### ✅ **Do:**
- Use on dark backgrounds for main logo
- Maintain aspect ratio when scaling
- Ensure minimum size of 32px for simple logo
- Use horizontal version for wide layouts
- Keep adequate white space around logo

### ❌ **Don't:**
- Stretch or distort the logo
- Use on backgrounds that reduce contrast
- Add effects or filters to the logo
- Use outdated versions
- Place text too close to the logo

## File Formats

| File | Format | Use Case |
|------|--------|----------|
| `logo.svg` | SVG | Web, scalable graphics |
| `logo-simple.svg` | SVG | Favicons, small icons |
| `logo-horizontal.svg` | SVG | Headers, branding |
| `logo-dark.svg` | SVG | Light backgrounds |

## Implementation

### **HTML Favicon**
```html
<link rel="icon" type="image/svg+xml" href="/logo-simple.svg" />
<link rel="apple-touch-icon" href="/logo-simple.svg" />
```

### **React Component**
```jsx
// Simple logo
<img src="/logo-simple.svg" alt="TrustCircle" className="w-8 h-8" />

// Horizontal logo
<img src="/logo-horizontal.svg" alt="TrustCircle" className="h-12" />
```

### **CSS Background**
```css
.logo {
  background-image: url('/logo-simple.svg');
  background-size: contain;
  background-repeat: no-repeat;
}
```

## Brand Applications

### **Digital**
- Website headers and footers
- Social media profiles and posts
- Mobile app icons
- Email signatures
- Digital presentations

### **Print**
- Business cards
- Letterheads
- Merchandise
- Banners and signage
- Documentation

### **Social Media Sizes**
- **Twitter/X**: 400x400px (use main logo)
- **LinkedIn**: 300x300px (use main logo)
- **Discord**: 512x512px (use simple logo)
- **GitHub**: 200x200px (use simple logo)

## Logo Meaning

The TrustCircle logo represents:

1. **Trust Network**: The circular design symbolizes the interconnected community of trusted users
2. **Security Shield**: Central shield represents protection from bots and malicious actors
3. **Verification**: Checkmark indicates authenticated, verified users
4. **AI Monitoring**: Trust nodes represent AI agents monitoring the network
5. **Multi-Chain**: Different colored nodes represent different blockchain networks
6. **Innovation**: Gradient colors and modern design reflect cutting-edge technology

---

**The TrustCircle logo embodies trust, security, innovation, and community - the core values of our bot-free crypto social network.**