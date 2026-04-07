# Redesign QA Checklists

## Shell And Tab Bar

- Verify light mode shell background matches redesign tokens.
- Verify dark mode shell background matches redesign tokens.
- Verify tab bar background, border, and indicator render correctly in light mode.
- Verify tab bar background, border, and indicator render correctly in dark mode.
- Verify active and inactive tab icons are legible in both themes.
- Verify active and inactive tab labels are legible in both themes.
- Verify safe area spacing is correct on top and bottom edges.
- Verify rounded tab bar corners do not clip content.
- Verify status bar content is dark in light mode and light in dark mode.
- Verify auth loading overlay matches the active theme.
- Verify route behavior is unchanged when switching tabs.

## Profile Tab

- Verify loading state renders without layout jump.
- Verify info banner or sync state renders correctly.
- Verify avatar hero renders with long display names.
- Verify username truncation or wrapping is acceptable.
- Verify stats row remains readable with 2-digit and 4-digit values.
- Verify badges rail scrolls correctly with 0, 1, 3, and many badges.
- Verify badge cards remain legible in both light and dark modes.
- Verify account settings rows render correctly with and without right-side values.
- Verify destructive row styling is distinct and accessible.
- Verify navigation actions for gyms, settings, badges, and logout remain correct after migration.

## Performance Tab

- Verify target date, trend cards, and KPI cards render correctly in both themes.
- Verify long metric values do not overflow cards.
- Verify chart contrast remains readable in light and dark modes.
- Verify goal and nutrition CTA buttons have clear pressed and disabled states.
- Verify fallback data banner renders without collapsing layout.
- Verify goal edit and nutrition edit flows still open and submit correctly.

## Workout Tab

- Verify date header layout remains stable across small and large devices.
- Verify macro bars preserve correct proportions and colors.
- Verify daily exercise metrics remain readable with large values.
- Verify weight trend and goal progress cards remain aligned at multiple text scales.
- Verify active muscles panel does not clip content in either theme.
- Verify start workout CTA remains obvious and reachable above the tab bar.
- Verify quick action modal opens, closes, and submits correctly.
- Verify fallback dashboard messaging remains visible but not disruptive.

## Food Log Tab

- Verify date strip selection is still correct after redesign.
- Verify calorie summary and macro bars match actual values.
- Verify timeline entries align with hour markers.
- Verify multiple entries in the same hour stack correctly.
- Verify long food names and subtitles wrap without overlap.
- Verify empty slot CTA remains easy to distinguish from saved entries.
- Verify quick add action remains visible above the keyboard.
- Verify create, edit, delete, and time picker flows still work end to end.
- Verify keyboard avoidance works on both iOS and Android.
- Verify scroll position and modal presentation remain stable on smaller devices.

## Regression Gate

- Run lint before each production screen migration.
- Run existing tests before each production screen migration.
- Manually verify both authenticated and fallback data paths when applicable.
- Manually verify light and dark mode for every migrated surface.
- Do not migrate the next tab until the current one passes its checklist.