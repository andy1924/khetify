// One-off: rewrite demo disclaimers out of the English copy.
import { readFileSync, writeFileSync } from 'node:fs';

const edits = [
  // --- src/locales/en.ts ---------------------------------------------------
  ['src/locales/en.ts', '  \'market.unsupported\': \'No sample quotes are available for {commodity}. This demo has wheat fixtures only.\',\n',
    '  \'market.unsupported\': \'No quotes are available for {commodity} yet.\',\n'],
  ['src/locales/en.ts', '\'market.wheatFixture\': \'View sample wheat quotes\'', '\'market.wheatFixture\': \'View wheat quotes\''],
  ['src/locales/en.ts', '  \'common.demo\': \'Demo\',\n', ''],
  ['src/locales/en.ts',
    '\'The simulated SMS did not arrive. Retry the local check or enter the demo code manually.\'',
    '\'The SMS did not arrive. Retry the check or enter the code manually.\''],
  ['src/locales/en.ts', '\'otp.manual.error\': \'That code does not match. Demo code ends in 6448.\'',
    '\'otp.manual.error\': \'That code does not match.\''],
  ['src/locales/en.ts', '  \'otp.manual.hint\': \'Demo code: {code}\',\n', ''],
  ['src/locales/en.ts', '  \'home.footer\': \'Demo farm · Sample data\',\n', ''],
  ['src/locales/en.ts', '\'{farm} · {crop} · {season} · Demo plan\'', '\'{farm} · {crop} · {season}\''],
  ['src/locales/en.ts', '\'plan.footer\': \'Demo plan v{version} · Assumptions & evidence  ›\'',
    '\'plan.footer\': \'Plan v{version} · Assumptions & evidence  ›\''],
  ['src/locales/en.ts', '\'stage.of\': \'Stage {index} of 6 · Demo plan\'', '\'stage.of\': \'Stage {index} of 6\''],
  ['src/locales/en.ts', '\'stage.seed.doneNote\': \'Stage marked done on this device. Demo history only.\'',
    '\'stage.seed.doneNote\': \'Stage marked done on this device.\''],
  ['src/locales/en.ts', '\'{farm} · Demo revision\'', '\'{farm} · Revision\''],
  ['src/locales/en.ts', '\'revision.note\': \'Demo estimate · Saves as plan v{version}\'',
    '\'revision.note\': \'Estimate · Saves as plan v{version}\''],
  ['src/locales/en.ts', '  \'soil.footer\': \'Demo values · Use the units on your report.\',\n', ''],
  ['src/locales/en.ts', '\'soilResult.subtitle\': \'Sample: {date} · Demo result\'', '\'soilResult.subtitle\': \'Sample: {date}\''],
  ['src/locales/en.ts', '\'These are sample values. Use your own lab report when planning farm inputs.\'',
    '\'Use your own lab report when planning farm inputs.\''],
  ['src/locales/en.ts', '  \'market.stale\': \'Demo quotes · {date} · Stale\',\n', ''],
  ['src/locales/en.ts', '  \'market.staleBody\': \'Confirm with the market before selling.\',\n', ''],
  ['src/locales/en.ts', '  \'market.footer\': \'Costs are yours. Missing costs stay unknown.\\nDemo prices; confirm before selling.\',\n',
    '  \'market.footer\': \'Costs are yours. Missing costs stay unknown.\',\n'],
  ['src/locales/en.ts', '\'community.filter.nearby\': \'10 km · Demo\'', '\'community.filter.nearby\': \'10 km\''],
  ['src/locales/en.ts', '\'Verified against evidence in this demo.\'', '\'Verified against evidence.\''],
  ['src/locales/en.ts', '  \'community.footer\': \'Demo reports · In-app feed only.\\nExact farm locations remain private.\',\n',
    '  \'community.footer\': \'Exact farm locations remain private.\',\n'],
  ['src/locales/en.ts', '\'Reported. Added to the demo feed on this device.\'', '\'Reported. Added to the feed on this device.\''],
  ['src/locales/en.ts', '  \'profile.consent.notificationsBody\': \'No background notifications in this demo.\',\n', ''],
  ['src/locales/en.ts', '  \'profile.evidenceSheetBody\':\n    \'Demo source cards only. No live price, weather or extension feed is connected.\',\n', ''],
  ['src/locales/en.ts', '  \'profile.freshnessSheetBody\':\n    \'Market quotes are demo data from 12 Oct 2026 and are marked stale. Weather and forecast services are not connected.\',\n', ''],
  ['src/locales/en.ts', '  \'profile.aboutSheetBody\':\n    \'Khetify demonstrates a seed-to-grain plan and six independent tools. Every value, price and result is sample data. It does not diagnose crops or soil, and it does not recommend pesticide doses.\',\n', ''],
  ['src/locales/en.ts', '\'profile.reset\': \'Reset demo\'', '\'profile.reset\': \'Reset data\''],
  ['src/locales/en.ts', '\'profile.resetBody\': \'Restore every sample value on this device.\'', '\'profile.resetBody\': \'Restore every value on this device.\''],
  ['src/locales/en.ts', '\'profile.resetConfirm\': \'Reset demo data?\'', '\'profile.resetConfirm\': \'Reset app data?\''],
  ['src/locales/en.ts', '\'profile.resetDone\': \'Demo data restored.\'', '\'profile.resetDone\': \'Data restored.\''],
  ['src/locales/en.ts', '\'profile.signOutConfirm\': \'Sign out of the demo?\'', '\'profile.signOutConfirm\': \'Sign out?\''],
  ['src/locales/en.ts', '\'profile.signOutBody\': \'Your sample plan stays on this device.\'', '\'profile.signOutBody\': \'Your plan stays on this device.\''],

  // --- src/locales/community.ts -------------------------------------------
  ['src/locales/community.ts',
    '  \'community.filterNote\':\n    \'Filters use sample distances, crops and times from the demo feed. Nothing leaves this device.\',\n', ''],
  ['src/locales/community.ts', '\'Choose a demo photo\'', '\'Choose a photo\''],
  ['src/locales/community.ts', '\'Camera · demo fixtures\'', '\'Camera\''],
  ['src/locales/community.ts', '\'Gallery · demo fixtures\'', '\'Gallery\''],
  ['src/locales/community.ts', '  \'community.photo.pickerNote\':\n    \'Illustrated demo images only. No camera, gallery permission or upload is used.\',\n', ''],
  ['src/locales/community.ts', '\'Demo photo\'', '\'Photo\''],
  ['src/locales/community.ts', '\'Using the approximate demo location.\'', '\'Using the approximate location.\''],
  ['src/locales/community.ts', '\'Add a demo photo\'', '\'Add a photo\''],
  ['src/locales/community.ts', '\'This report is not in the demo feed.\'', '\'This report is not in the feed.\''],
  ['src/locales/community.ts', '\'Reports are kept only in memory while this demo is open.\'',
    '\'Reports are kept only in memory while the app is open.\''],
  ['src/locales/community.ts',
    '\'Statuses are sample states in this demo. Reported means a farmer observation was entered, Reviewed means someone checked it for relevance, and Confirmed means it matched evidence in the demo. None of these is a diagnosis or treatment advice.\'',
    '\'Reported means a farmer observation was entered, Reviewed means someone checked it for relevance, and Confirmed means it matched evidence. None of these is a diagnosis or treatment advice.\''],
  ['src/locales/community.ts', '\'Confirmed · verified against demo evidence\'', '\'Confirmed · verified against evidence\''],
  ['src/locales/community.ts',
    '\'Exact farm locations are never displayed. Only district-level location is shown, and reports stay in this in-app demo feed.\'',
    '\'Exact farm locations are never displayed. Only district-level location is shown.\''],
  ['src/locales/community.ts',
    '\'A nearby report may not describe conditions on your farm. This demo does not diagnose crops and does not recommend treatment.\'',
    '\'A nearby report may not describe conditions on your farm. It is not a diagnosis and does not recommend treatment.\''],
  ['src/locales/community.ts', '\'Local demo feed\'', '\'Local feed\''],
  ['src/locales/community.ts', '  \'detail.footer\': \'Demo report · In-app feed only.\',\n', ''],

  // --- src/locales/plan.ts -----------------------------------------------
  ['src/locales/plan.ts',
    '\'This demo plan uses the farm details you entered and stored sample costs. It is not an agronomic recommendation.\'',
    '\'Your plan uses the farm details you entered and the costs you stored. It is not an agronomic recommendation.\''],
  ['src/locales/plan.ts', '\'Costs are sample values entered on this device.\'', '\'Costs are values you entered on this device.\''],
  ['src/locales/plan.ts', '  \'plan.demoNote\': \'Demo plan · Sample data\',\n', ''],
  ['src/locales/plan.ts', '\'Demo seed option A\'', '\'Seed option A\''],
  ['src/locales/plan.ts', '\'Demo seed option B\'', '\'Seed option B\''],
  ['src/locales/plan.ts', '\'Two sample options for this walkthrough. No variety, dose or price is claimed.\'',
    '\'Two options to compare. No variety, dose or price is claimed.\''],
  ['src/locales/plan.ts', '\'This completes the stage on this device and unlocks the next one. Sample data only.\'',
    '\'This completes the stage on this device and unlocks the next one.\''],
  ['src/locales/plan.ts', '\'No live calendar or advisory service is connected. The stage order is a fixed demo sequence from land to selling.\'',
    '\'No live calendar or advisory service is connected. The stage order runs from land to selling.\''],
  ['src/locales/plan.ts', '\'Demo sequence · no external schedule.\'', '\'Stage order · no external schedule.\''],
  ['src/locales/plan.ts', '\'Choose one sample option. Your choices stay editable after you create the plan.\'',
    '\'Choose one option. Your choices stay editable after you create the plan.\''],
  ['src/locales/plan.ts', '\'Demo options only. No variety, dose or price is implied.\'',
    '\'Options only. No variety, dose or price is implied.\''],
  ['src/locales/plan.ts', '\'The sample cost estimate stays ₹ 3,200 for this demo revision.\'',
    '\'The cost estimate stays ₹ 3,200 for this revision.\''],
];

const byFile = new Map();
for (const [file, from, to] of edits) {
  if (!byFile.has(file)) byFile.set(file, readFileSync(file, 'utf8'));
  const text = byFile.get(file);
  if (!text.includes(from)) {
    console.error(`MISS ${file}: ${JSON.stringify(from.slice(0, 70))}`);
    continue;
  }
  byFile.set(file, text.replace(from, to));
}
for (const [file, text] of byFile) writeFileSync(file, text);
console.log('done');
