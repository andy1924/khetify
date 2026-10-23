export const profileCopy = {
  'profile.identityA11y': 'Farm profile for {name}, {location}',
  'profile.editFarmA11y': 'Edit farm details for {farm}',
  'profile.acres': '{area} acres',
  'profile.water.rainfed': 'Rainfed',
  'profile.water.limited': 'Limited',
  'profile.water.reliable': 'Reliable',

  'profile.editTitle': 'Edit farm details',
  'profile.editSubtitle': 'These values feed your plan and tools.',
  'profile.field.name': 'Your name',
  'profile.field.district': 'District',
  'profile.field.state': 'State',
  'profile.field.farm': 'Farm name',
  'profile.field.area': 'Area (acres)',
  'profile.field.water': 'Water availability',
  'profile.field.budget': 'Season budget (₹)',
  'profile.edit.discard': 'Discard changes',
  'profile.edit.discardTitle': 'Discard these changes?',
  'profile.edit.discardBody': 'The farm keeps the values you last saved.',
  'profile.edit.keepEditing': 'Keep editing',
  'profile.saveAction': 'Save changes',
  'profile.saved': 'Farm details saved.',

  'profile.languageNote':
    'Only English copy is reviewed. Other languages keep English interface text until a reviewed translation is added.',

  'profile.consentHeading': 'Consent',
  'profile.consentNote':
    'Choose what you want to share.',
  'profile.consent.locationDetail': 'Used only for the distance label on demo reports.',
  'profile.consent.communityDetail': 'Reports you submit appear only in this demo feed.',
  'profile.consent.notificationsDetail': 'Reminders stay inside this demo while it is open.',

  'profile.evidence.body':
    'Sample source cards from the demo: farm details you entered, the two soil values in your sample, and market quotes dated 12 Oct 2026. No live extension, weather or price source is connected.',
  'profile.evidence.sources': 'Sources in this demo',
  'profile.evidence.farm': 'Farm details · entered by you',
  'profile.evidence.soil': 'Soil sample · 2 of 12 values entered',
  'profile.evidence.market': 'Market quotes · 12 Oct 2026 · stale',
  'profile.evidence.limits': 'What is not available',
  'profile.evidence.limitsBody':
    'No weather feed, no market API, no soil laboratory link and no crop diagnosis.',

  'profile.freshness.body':
    'Market quotes are demo data from 12 Oct 2026 and are marked stale. Weather, forecast and market services are not connected, so freshness cannot be refreshed from this screen.',
  'profile.freshness.quotes': 'Market quotes',
  'profile.freshness.quotesValue': '12 Oct 2026 · stale',
  'profile.freshness.soil': 'Soil sample',
  'profile.freshness.soilValue': 'Entered by you · not refreshed',
  'profile.freshness.farm': 'Farm details',
  'profile.freshness.farmValue': 'Saved on this device only',

  'profile.about.body':
    'Khetify helps you plan farm work, understand soil tests and compare market prices. This version includes sample data.',
  'profile.about.simulated': 'Simulated in this demo',
  'profile.about.simulatedBody':
    'Sample results help you explore the app. Check your own reports and current market prices before making farm decisions.',
  'profile.about.resetTitle': 'Demo controls',
  'profile.about.resetBody': 'Reset restores every sample value. Sign out clears the demo session.',

  'profile.demoControls': 'DEMO CONTROLS',
  'profile.demoNote': 'Small controls for reviewing this UI demo.',
  'profile.resetA11y': 'Reset demo data',
  'profile.signOutA11y': 'Sign out of the demo',
  'profile.firstVisit': 'First-visit scenario',
  'profile.firstVisitBody': 'Start the demo with an empty farm plan.',
  'profile.firstVisitA11y': 'Start the first-visit scenario',
} as const;
export type ProfileCopyKey = keyof typeof profileCopy;
