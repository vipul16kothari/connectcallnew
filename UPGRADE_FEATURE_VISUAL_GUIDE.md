# In-Call Upgrade Feature - Visual Guide

## User Call Screen (Audio Call)

### Main Timer Display
```
┌────────────────────────────────────┐
│  ┌──────────────────────────────┐  │
│  │  🔴                          │  │
│  │     25:30                    │  │ ← Large countdown timer
│  │    remaining                 │  │
│  └──────────────────────────────┘  │
│                                    │
│        Sarah Chen                  │
│    10 coins/min • AUDIO            │
└────────────────────────────────────┘
```

### Control Panel Layout
```
┌─────────────────────────────────────────┐
│                                         │
│   ┌───┐    ┌──────┐    ┌───┐    ┌───┐ │
│   │🎤 │    │ 🎥+  │    │ ☎ │    │ 💰│ │
│   └───┘    │Switch│    └───┘    └───┘ │
│   Mute     │Video │   End Call  Coins │
│            └──────┘                    │
│              ↑                         │
│         NEW BUTTON!                    │
└─────────────────────────────────────────┘
```

### Button States

**Idle State (Ready to Request)**
```
┌──────────┐
│    🎥    │ ← Video camera icon
│    +     │ ← Plus badge
└──────────┘
Purple gradient with accent border
```

**Sending State**
```
┌──────────┐
│    ⌛    │ ← Hourglass icon
│ Sending..│
└──────────┘
Animated loading state
```

**Pending State**
```
┌──────────┐
│    ⌛    │
│ Pending  │
└──────────┘
Waiting for host response
```

**Disabled State (3 Attempts Used)**
```
┌──────────┐
│    🎥    │ ← Gray color
│    ✗     │ ← Disabled badge
└──────────┘
Grayed out, opacity 0.5, unresponsive
```

---

## Host Call Screen

### Upgrade Request Banner
```
┌─────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────┐ │
│ │  🎥  Video Call Request        [ 12s ] │ │ ← Auto-timeout countdown
│ │      User wants to switch to video      │ │
│ │                                         │ │
│ │  ┌────────────┐    ┌────────────┐     │ │
│ │  │ ✗ Reject   │    │ ✓ Accept   │     │ │
│ │  └────────────┘    └────────────┘     │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
      ↑ Slides in from top with spring animation
```

### Banner Color Scheme
```
Background: rgba(0, 0, 0, 0.95) - Dark, translucent
Border: Accent color with glow effect
Timeout Badge: Warning orange (#FFB800)
Reject Button: Gray with gray border
Accept Button: Teal/Green (#00D1C5) with glow
```

---

## Timer Animation (Upgrade Accepted)

### Spin-Down Sequence
```
Frame 1:  45:00  ← Initial audio time
Frame 5:  40:30
Frame 10: 35:45
Frame 15: 30:20
Frame 20: 15:10
Frame 25: 09:45
Frame 30: 07:30  ← Final video time

Total duration: ~1 second (smooth countdown effect)
```

### Visual Feedback During Animation
```
Before:                       After:
┌─────────────────┐          ┌─────────────────┐
│  🔴             │          │  🔴             │
│    45:00        │   ───▶   │    07:30        │
│   remaining     │          │   remaining     │
│                 │          │                 │
│ 10 coins/min    │          │ 60 coins/min    │
│  • AUDIO        │          │  • VIDEO        │
└─────────────────┘          └─────────────────┘
```

---

## Low Balance Warning State

### When < 60 Seconds Remaining
```
┌────────────────────────────────────┐
│  ┌──────────────────────────────┐  │
│  │  ⚠️                          │  │
│  │     00:45                    │  │ ← Orange/yellow color
│  │    remaining                 │  │
│  └──────────────────────────────┘  │ ← Pulsing orange border
│                                    │
│  ⚠️ Low balance! Add coins to      │
│     continue                       │
│                                    │
│     ┌──────────────────┐          │
│     │  💰 Add Coins    │          │ ← Prominent button
│     └──────────────────┘          │
└────────────────────────────────────┘
```

---

## Notification Messages

### User Notifications
```
✅ "Upgrade request sent to host"
   (appears when request is sent)

🎥 "Upgraded to video call!"
   (appears when host accepts)

❌ "Host declined video upgrade"
   (appears when host rejects)

❌ "Maximum upgrade requests reached for this call"
   (appears after 3rd rejection)

❌ "Call ended: Out of coins"
   (appears when timer reaches 00:00)
```

### Host Notifications
```
🔔 [Banner appears with slide-in animation]
   "User wants to switch to video"
   (10-second auto-simulation in current implementation)
```

---

## Flow Diagrams

### Complete User Flow
```
┌──────────────────────────────────────────────────────────┐
│ User starts audio call                                   │
│   Timer: 30:00 (300 coins ÷ 10 coins/min)              │
└──────────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│ User taps "Switch to Video" button                      │
│   Button state: idle → sending → pending                │
│   Attempts: 1/3                                          │
└──────────────────────────────────────────────────────────┘
                        │
                ┌───────┴────────┐
                ▼                ▼
        ┌─────────────┐   ┌─────────────┐
        │   ACCEPT    │   │   REJECT    │
        └─────────────┘   └─────────────┘
                │                │
                ▼                ▼
    ┌──────────────────┐  ┌───────────────────┐
    │ Camera activates │  │ Error message     │
    │ Timer recalcs:   │  │ Button: idle      │
    │   30:00 → 05:00  │  │ Attempts: 2/3     │
    │ Smooth animation │  │ Can try again     │
    └──────────────────┘  └───────────────────┘
                                  │
                         ┌────────┴────────┐
                         │ 2 more attempts │
                         │ before disabled │
                         └─────────────────┘
```

### Host Response Flow
```
┌──────────────────────────────────────┐
│ Host receives upgrade request        │
│   Banner slides in from top          │
│   Timeout: 15 seconds                │
└──────────────────────────────────────┘
                │
        ┌───────┼───────┬──────────┐
        ▼       ▼       ▼          ▼
    ┌─────┐ ┌─────┐ ┌───────┐ ┌───────┐
    │Accept│ │Reject│ │Timeout│ │Ignore │
    └─────┘ └─────┘ └───────┘ └───────┘
        │       │       │          │
        └───────┴───────┴──────────┘
                │
                ▼
        ┌──────────────┐
        │ Banner slides│
        │ out & closes │
        └──────────────┘
```

---

## Cost Examples

### Example 1: Full Audio Call
```
Balance: 600 coins
Rate: 10 coins/min
Duration: 60 minutes

Timer Display:
Start: 60:00
After 30 min: 30:00
After 59 min: 01:00
After 60 min: 00:00 → Call ends
```

### Example 2: Upgrade After 15 Minutes
```
Balance: 600 coins
Audio rate: 10 coins/min
Video rate: 60 coins/min

Initial:
  Duration: 60:00 (audio)

After 15 minutes:
  Spent: 150 coins
  Remaining: 450 coins

Upgrade accepted:
  New duration: 07:30 (video)
  Animation: 45:00 → 07:30 in 1 second
```

### Example 3: Low Balance Warning
```
Balance: 100 coins
Rate: 60 coins/min (video)

Timer Display:
Start: 01:40
After 40 sec: 01:00 → Warning appears
After 80 sec: 00:20 → Orange pulsing
After 100 sec: 00:00 → Call ends
```

---

## Responsive Design

### Timer Size Scaling
```
Portrait:  Large (4xl font)
Landscape: Medium (3xl font)
Tablet:    Extra Large (5xl font)
```

### Button Layout Adaptation
```
Phone (Portrait):
┌─────────────────────┐
│  [Mute] [Video]     │
│  [End]  [Coins]     │
└─────────────────────┘

Tablet (Landscape):
┌───────────────────────────────┐
│ [Mute] [Video] [End] [Coins]  │
└───────────────────────────────┘
```

---

## Accessibility Features

### Color Contrast
- Timer text: High contrast white on dark background
- Warning state: Yellow/orange with dark background (WCAG AA+)
- Buttons: 3:1 minimum contrast ratio

### Touch Targets
- All buttons: 60×60 minimum
- End call button: 70×70 (larger target)
- Banner buttons: 48+ height (full width)

### Visual Feedback
- Button press: Opacity change (activeOpacity={0.7})
- State changes: Icon + text + color
- Loading states: Animated hourglass

---

## Performance Optimizations

### Animation Performance
- `useNativeDriver: true` for all animations
- 30fps for timer spin-down (smooth without overhead)
- Spring animations cached and reused

### State Management
- Minimal re-renders with `useRef` for animation values
- Debounced button presses (disabled state)
- Efficient timer updates (setInterval cleanup)

### Memory Management
- Cleanup functions for all intervals
- Animation cleanup on unmount
- Banner auto-dismiss prevents memory leak

---

This visual guide provides a comprehensive reference for understanding the implemented upgrade feature's UI and UX behavior.
