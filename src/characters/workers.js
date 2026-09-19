function buildWorkerCharacter(armed){
  var spec= armed?
    {skin:choice([0xd8ae7e,0xc99868]), under:0x5a4a3a, sleeves:0x4e4030, legs:0x3f3628,
     armor:'mail', armorCol:0x6e7480, armorY:1.42, helm:'nasal', weapon:'xiphos',
     bracers:true, bracerCol:0x4e4030, hairCol:choice([0x2a1d10,0x4a3520])}
    :{skin:choice([0xd8ae7e,0xc99868,0xe8bd90]), under:choice([0x6a5a44,0x7a6448]),
     sleeves:choice([0x5a4a38,0x64583e]), legs:0x3f3628, armor:'none', helm:'bare',
     hairCol:choice([0x4a3520,0x2a1d10])};
  var built=buildCharacter(spec);
  return built;
}
