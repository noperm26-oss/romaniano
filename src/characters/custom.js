/* Extension point, loaded after all factions and before derived textures/recruits.
   Add a class: FACS.moldavia.classes.yourId = { ...complete class definition... };
   Add a rig: CHARACTER_RIGS.yourRig = function(spec) { return {group, body, parts, mats, weapon, ranged}; };
   Select it: FACS.moldavia.classes.yourId.spec.rig = 'yourRig';
   See docs/EDITING.md. No network assets or modern weapons. */
