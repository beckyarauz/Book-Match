const Tagify = require('@yaireo/tagify');
document.addEventListener('DOMContentLoaded', () => {
  //TAGGIFY
  let input = document.querySelector('input[name=tags]');
  if (input !== null) {
    // init Tagify script on the above inputs
    // tagify = new Tagify(input, {
    //   whitelist: ["A# .NET", "A# (Axiom)", "A-0 System", "A+", "A++", "ABAP", "ABC", "ABC ALGOL", "ABSET", "ABSYS", "ACC", "Accent", "Ace DASL", "ACL2", "Avicsoft", "ACT-III", "Action!", "ActionScript", "Ada", "Adenine", "Agda", "Agilent VEE", "Agora", "AIMMS", "Alef", "ALF", "ALGOL 58", "ALGOL 60", "ALGOL 68", "ALGOL W", "Alice", "Alma-0", "AmbientTalk", "Amiga E", "AMOS", "AMPL", "Apex (Salesforce.com)", "APL", "AppleScript", "Arc", "ARexx", "Argus", "AspectJ", "Assembly language", "ATS", "Ateji PX", "AutoHotkey", "Autocoder", "AutoIt", "AutoLISP / Visual LISP", "Averest", "AWK", "Axum", "Active Server Pages", "ASP.NET", "B", "Babbage", "Bash", "BASIC", "bc", "BCPL", "BeanShell", "Batch (Windows/Dos)", "Bertrand", "BETA", "Bigwig", "Bistro", "BitC", "BLISS", "Blockly", "BlooP", "Blue", "Boo", "Boomerang", "Bourne shell (including bash and ksh)", "BREW", "BPEL", "B", "C--", "C++ – ISO/IEC 14882", "C# – ISO/IEC 23270", "C/AL", "Caché ObjectScript", "C Shell", "Caml", "Cayenne", "CDuce", "Cecil", "Cesil", "Céu", "Ceylon", "CFEngine", "CFML", "Cg", "Ch", "Chapel", "Charity", "Charm", "Chef", "CHILL", "CHIP-8", "chomski", "ChucK", "CICS", "Cilk", "Citrine (programming language)", "CL (IBM)", "Claire", "Clarion", "Clean", "Clipper", "CLIPS", "CLIST", "Clojure", "CLU", "CMS-2", "COBOL – ISO/IEC 1989", "CobolScript – COBOL Scripting language", "Cobra", "CODE", "CoffeeScript", "ColdFusion", "COMAL", "Combined Programming Language (CPL)", "COMIT", "Common Intermediate Language (CIL)", "Common Lisp (also known as CL)", "COMPASS", "Component Pascal", "Constraint Handling Rules (CHR)", "COMTRAN", "Converge", "Cool", "Coq", "Coral 66", "Corn", "CorVision", "COWSEL", "CPL", "CPL", "Cryptol", "csh", "Csound", "CSP", "CUDA", "Curl", "Curry", "Cybil", "Cyclone", "Cython", "M2001", "M4", "M#", "Machine code", "MAD (Michigan Algorithm Decoder)", "MAD/I", "Magik", "Magma", "make", "Maple", "MAPPER now part of BIS", "MARK-IV now VISION:BUILDER", "Mary", "MASM Microsoft Assembly x86", "MATH-MATIC", "Mathematica", "MATLAB", "Maxima (see also Macsyma)", "Max (Max Msp – Graphical Programming Environment)", "Maya (MEL)", "MDL", "Mercury", "Mesa", "Metafont", "Microcode", "MicroScript", "MIIS", "Milk (programming language)", "MIMIC", "Mirah", "Miranda", "MIVA Script", "ML", "Model 204", "Modelica", "Modula", "Modula-2", "Modula-3", "Mohol", "MOO", "Mortran", "Mouse", "MPD", "Mathcad", "MSIL – deprecated name for CIL", "MSL", "MUMPS", "Mystic Programming L"],
    //   //  blacklist : [".NET", "PHP"] // <-- passed as an attribute in this demo
    // });
    tagify = new Tagify(input, {
      delimiters          : ",| ",  // add new tags when a comma or a space character
      maxTags             : 6,
      blacklist           : ["fuck", "shit", "pussy","asshole","cum","cunt","piss","cock","dick","ass","tits","titites","motherfucker","fucking","shithole"],
      keepInvalidTags     : true,  // do not remove invalid tags (but keep them marked as invalid)
      whitelist           : ["tragedy","romance","science fiction", "adventure", "fantasy", "mythology","drama", "science", "programming","javascript","horror","thriller", "young adult","satire","comedy","action","biography","comics","manga","humor","suspense","memoir","religious","fiction","erotic","Psychological"],
      transformTag        : transformaTag,
      enforceWhitelist : true,
      dropdown : {
          enabled: 3,
      }
  })

    // "remove all tags" button event listener
    document.querySelector('.tags--removeAllBtn')
      .addEventListener('click', tagify.removeAllTags.bind(tagify))

      function transformaTag( value ){
        if( value == 'shit' )
        return 's✲✲t';
    }
    // Chainable event listeners
    tagify.on('add', onAddTag)
      .on('remove', onRemoveTag)
      .on('input', onInput)
      .on('invalid', onInvalidTag)
      .on('click', onTagClick);

    // tag added callback
    function onAddTag(e) {
      // console.log(e.detail);
      // console.log("original input value: ", input.value)
      axios.post('/profile-setup', {
        tags: input.value
      });
      // tagify.off('add', onAddTag) // exmaple of removing a custom Tagify event
    }

    // tag remvoed callback
    function onRemoveTag(e) {
      // console.log(e.detail);
      // console.log("tagify instance value:", tagify.value);
      axios.post('/profile-setup', {
        removetags: tagify.value
      });
    }

    // on character(s) added/removed (user is typing/deleting)
    function onInput(e) {
      console.log(e.detail);
    }

    // invalid tag added callback
    function onInvalidTag(e) {
      console.log(e.detail);
    }

    // invalid tag added callback
    function onTagClick(e) {
      console.log(e.detail);
    }
  }
})