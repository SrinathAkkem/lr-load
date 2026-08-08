# Changelog - lr-load v2

## Version 2.0.0 - August 4, 2026

### 🎨 Design System Updates

#### Company Admin Login Page
**File**: `src/app/company/login/page.tsx`

##### Visual Changes
- **Left Panel**:
  - Changed from purple gradient to solid light purple (#F2EFFA)
  - Centered content layout (previously top-aligned)
  - Removed decorative background circles
  - Updated heading to 32px (previously 36px)
  - Added illustration image placeholder
  - Removed pagination dots

- **Right Panel**:
  - Centered logo placement (previously only on left panel)
  - Centered heading and subtext (previously left-aligned)
  - Updated heading size to 30px bold (previously 24px)
  - Changed subtext color to #4D4D4D (previously #9ca3af)

##### Form Design Updates
- **Input Fields**:
  - Increased height to 54px (previously ~40px)
  - Changed background to #F5F5F7 (previously white with border)
  - Rounded corners increased to 12px (previously 6px)
  - Removed focus ring styling
  - Updated placeholder styling

- **Buttons**:
  - Replaced gradient button with solid black (#000)
  - Updated to 48px height
  - Border radius 12px
  - White text with letter-spacing
  - Added border for depth

- **OTP Input**:
  - Changed from individual OTP slots to single input field
  - Maintains 6-digit validation
  - Added center text alignment with letter-spacing
  - Integrated within main form flow

##### Typography
- **Font Stack**: System fonts (Host Grotesk intended, using fallbacks)
- **Heading**: 30px, font-weight: 700
- **Subheading**: 16px, font-weight: 400
- **Button Text**: 16px, font-weight: 700, letter-spacing: 0.32px
- **Label**: 16px, font-weight: 400, line-height: 140%
- **Footer**: 14px, font-weight: 400, line-height: 22px

##### Spacing & Layout
- Consistent 8px spacing grid
- Form max-width: 418px (previously ~28rem/448px)
- Gap between elements: 56px for major sections, 32px for form sections
- Input padding: 20px horizontal, 16px vertical

##### Colors
```css
--purple-primary: #5E3EA1
--purple-secondary: #8B359E
--purple-light-bg: #F2EFFA
--text-primary: #000000
--text-secondary: #4D4D4D
--input-bg: #F5F5F7
--button-bg: #000000
--button-text: #FFFFFF
```

### 🔧 Component Changes

#### New Logo Component
Created inline `RonoHubLogo` component using SVG icons from Figma export:
- Uses individual SVG path files (icon_2, icon_4, icon_6)
- Renders logo with colored gradient elements
- Text logo using "ronohub" branding

#### Removed Dependencies
- No longer using `RonoLogo` from `@/components/rono/brand`
- No longer using `RonoGradientButton` component
- No longer using `InputOTP` component from ui library
- No longer using `Label` component

### 📦 Assets Added
- `public/icon_1_path144.svg` through `public/icon_13_path153.svg` - Logo SVG components
- `public/login-illustration.png` - Login screen illustration
- `public/truck-illustration.svg` - Custom truck illustration (backup)

### 🔄 Backward Compatibility
- All API endpoints remain unchanged
- Authentication flow logic unchanged
- Database schema unchanged
- Session management unchanged
- Mobile responsive behavior maintained

### 🐛 Bug Fixes
None - This is a visual redesign only

### ⚙️ Configuration Changes
- Updated `package.json`:
  - Name: `rono-lr-web-v2`
  - Version: `2.0.0`

### 📝 Migration Notes
1. No database migrations required
2. No API changes needed
3. Environment variables remain the same
4. Can run side-by-side with v1 on different ports

### 🎯 Next Steps
Consider updating:
- [ ] Dashboard UI to match new design language
- [ ] Super admin login page
- [ ] LR management pages
- [ ] Profile pages
- [ ] Mobile app designs to match

### 🔍 Testing Checklist
- [x] Mobile number input validation
- [x] OTP send functionality
- [x] OTP verification
- [x] Error handling and toast notifications
- [x] Loading states
- [x] Redirect after successful login
- [x] Mobile responsive design
- [x] Logo rendering
- [x] Illustration display

---

**Design Source**: Figma export from company-admin-login
**Implementation Date**: August 4, 2026
**Developer**: Cursor AI Assistant
