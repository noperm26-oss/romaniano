/* Edit movement here without changing AI, damage, recruitment or character meshes. */
var ANIMATION_PROFILES={
  warrior:{stride:0.62,knee:1.05,bob:0.07,sway:0.05,deathSpeed:2.6},
  heavy:{stride:0.52,knee:0.95,bob:0.05,sway:0.035,deathSpeed:2.2}
};
function animationProfile(e){return ANIMATION_PROFILES[e.animationProfile]||ANIMATION_PROFILES.warrior;}
