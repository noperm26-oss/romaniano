function buildVillagerCharacter(){
  var spec={skin:choice([0xd8ae7e,0xc99868,0xe8bd90]), under:choice([0x7a6a4a,0x6a7a5a,0x8a7a5a]), sleeves:choice([0x6a5a44,0x5a6a4a,0x7a5a4a]),
    legs:0x4a4034, armor:'none', helm:'bare', hairCol:choice([0x4a3520,0x2a1d10,0x6a5230]), skirtCol:choice([0x5a4a3a,0x4a5a3a])};
  var built=buildCharacter(spec);
  return built;
}
