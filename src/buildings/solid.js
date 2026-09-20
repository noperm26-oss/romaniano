/* ---------------- solid structures: cheap no-interior buildings ---------------- */
function solidBuilding(x,z,w,d,h,wallCol,roofCol,roof){
  /* Same silhouette language as the detailed tier — plinth, real door and
     window openings, eaves, ridge, chimney — merged into a few meshes and
     sealed by a single footprint collider. */
  return buildSolidStructure(x,z,w,d,h,wallCol,roofCol,roof);
}
