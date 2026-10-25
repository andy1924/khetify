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
  'profile.consent.locationDetail': 'Used only for the distance label on reports.',
  'profile.consent.communityDetail': 'Reports you submit appear in the in-app feed.',
  'profile.consent.notificationsDetail': 'Reminders stay inside the app while it is open.',

  'profile.evidence.body':
    'Sources behind the cards here: farm details you entered, the two soil values in your sample, and the market quotes shown in Prices.',
  'profile.evidence.sources': 'Sources',
  'profile.evidence.farm': 'Farm details · entered by you',
  'profile.evidence.soil': 'Soil sample · 2 of 12 values entered',
  'profile.evidence.market': 'Market quotes · 12 Oct 2026',
  'profile.evidence.limits': 'What is not available',
  'profile.evidence.limitsBody':
    'No weather feed, market API, soil laboratory link or crop diagnosis.',

  'profile.freshness.body':
    'Market quotes are dated 12 Oct 2026. Weather and forecasting are not connected, so freshness cannot be refreshed from this screen.',
  'profile.freshness.quotes': 'Market quotes',
  'profile.freshness.quotesValue': '12 Oct 2026',
  'profile.freshness.soil': 'Soil sample',
  'profile.freshness.soilValue': 'Entered by you · not refreshed',
  'profile.freshness.farm': 'Farm details',
  'profile.freshness.farmValue': 'Saved on this device only',

  'profile.about.body':
    'Khetify helps you plan farm work, understand soil tests and compare market prices.',
  'profile.about.resetTitle': 'App controls',
  'profile.about.resetBody': 'Reset restores every value. Sign out clears the session.',

  'profile.demoControls': 'APP CONTROLS',
  'profile.demoNote': 'Small controls for reviewing the app.',
  'profile.resetA11y': 'Reset app data',
  'profile.signOutA11y': 'Sign out',
  'profile.firstVisit': 'First-visit scenario',
  'profile.firstVisitBody': 'Start with an empty farm plan.',
  'profile.firstVisitA11y': 'Start the first-visit scenario',
} as const;
export type ProfileCopyKey = keyof typeof profileCopy;
