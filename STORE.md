# Store listing — Grid Tac Toe

Copy and paste these into App Store Connect and Google Play Console.

> **Trademark rule:** never use "F1", "Formula 1", "Formula One", "Grand Prix", or real team or driver names
> in the app name, subtitle, keywords, description, or screenshots. Both stores reject listings that use
> another company's trademarks. "Racing-themed" is fine.

## Shared

| Field | Value |
| --- | --- |
| App name | **Grid Tac Toe** |
| Bundle ID / package name | `com.oneinfinitylabs.gridtactoe` |
| Version | 1.0.0 (build 1) |
| Category | Games → Board (Apple: primary *Games*, subcategories *Board* + *Family*; Google: *Board*) |
| Price | Free, no in-app purchases, no ads |
| Privacy policy URL | https://grid-tac-toe.netlify.app/privacy.html |
| Support URL | https://grid-tac-toe.netlify.app/support.html |
| Marketing URL (optional) | https://grid-tac-toe.netlify.app |
| Contact email | heemang@oneinfinitylabs.com |

### Short description / subtitle

- **Apple subtitle** (30 chars max): `Racing tic-tac-toe vs the CPU`
- **Google short description** (80 chars max): `Racing-themed tic-tac-toe. Beat the Rookie, outfox the Pro, survive the Champion.`

### Promotional text (Apple, 170 chars, editable without review)

`Five red lights… go! Race your car against a rival's tyres on a 3×3 grid. Can you hold the Champion to a photo finish?`

### Full description (Apple + Google)

```
Lights out — it's tic-tac-toe at racing speed.

Grid Tac Toe turns the classic game into a race. Your car takes on a computer rival's tyres on a 3×3 starting grid. Get three in a row across, down or diagonally to take the chequered flag.

CHOOSE YOUR RIVAL
• Rookie: still learning the circuit. Perfect for kids and first-timers.
• Pro: solid racecraft, but you can outfox them with a clever double threat.
• Champion: never makes a mistake. Can you hold them to a photo finish?

RACE DAY FEATURES
• A five-light start sequence before every race
• Pick your car's livery from six colours
• Choose who starts from pole: you, your rival, or alternate
• Win 25 points, draw 10. Build your season total and track your wins, draws and losses
• Engine sounds, satisfying haptics and confetti when you win
• Designed for one-handed play on any phone

PLAY ANYWHERE
• Works fully offline, no internet needed
• No account, no ads, no tracking, no data collected
• Suitable for all ages

Grid Tac Toe is an independent game and is not affiliated with or endorsed by any motorsport series or team.
```

### Apple keywords (100 chars, comma-separated, no spaces)

```
tic,tac,toe,tictactoe,noughts,crosses,racing,race,car,board,puzzle,offline,kids,family,2048,strategy
```

(Avoid the app name and category in keywords; they're indexed already. Swap `2048` for something else if you prefer; it's just filler for related searches.)

### What's new (1.0.0)

`First release. Lights out and good luck!`

## App Store Connect: App Privacy

- **Data collection:** *No, we do not collect data from this app.* The result is the "Data Not Collected" label.
- **Age rating questionnaire:** answer *None* to everything, so the app is rated **4+**.
- **Made for Kids:** leave **off**. Opting in adds extra review rules; the game is still rated 4+ and visible to everyone.
- **Export compliance:** handled already (`ITSAppUsesNonExemptEncryption = NO` in Info.plist).
- **Content rights:** "Does not contain, show, or access third-party content."

## Google Play Console: App content

- **Privacy policy:** URL above.
- **Ads:** No ads.
- **App access:** All functionality available without special access.
- **Content rating (IARC questionnaire):** Category *Game* → answer *No* to violence, fear, gambling and the rest. Expect **Everyone / PEGI 3**.
- **Target audience:** 13+ is simplest. Including under-13 age groups triggers the Families policy, which this app would pass, but it adds review steps.
- **Data safety:** *Does your app collect or share any of the required user data types?* → **No**. Encryption in transit → not applicable (no data sent). Data deletion → not applicable.
- **Government app / Financial features / Health:** No.

## Assets (in `store/`)

| Store | File(s) | Size |
| --- | --- | --- |
| App Store, iPhone 6.9" (required) | `store/ios-6.9/1-…5-*.png` | 1320 × 2868 |
| Google Play, phone screenshots | `store/android-phone/1-…5-*.png` | 1080 × 1920 |
| Google Play, feature graphic | `store/android-feature-graphic-1024x500.png` | 1024 × 500 |
| Google Play, app icon | `store/android-icon-512.png` | 512 × 512 |
| App Store icon | bundled in the Xcode project (`AppIcon`) | 1024 × 1024 |

The app is set to **iPhone only** and **portrait only**, so no iPad screenshots are needed.
Regenerate screenshots with `npm start` in one terminal and `npm run screenshots` in another.
