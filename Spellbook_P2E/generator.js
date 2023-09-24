
var owned_spells;

// this function takes input and randomly generates a
// spellbook for the given class with maximum spell level
// given in the input
var spellbook = function() {
  // get spells from json
  $('#my_spells').empty();
  var out = $('#my_spells');
  var strout = "<h2>Spellbook</h2>";
  // get level from input 
  var level = $('#class_level').val();
  var income = $('#wealth_level').val();
  // maximum level spells known, minimum 
  // number of spells known
  var max_level;	// integer for maximum level spell
  var spells_known = [];	// array for storing 
  owned_spells = [{}];
  // spells of every level
  spells_known[0] = undefined;
  if (level >= 1 && level <= 20) {
    //spells_known = (level * 2) + 4;
    if (level < 17)
      max_level = Math.ceil(level / 2);
    else
      max_level = 9;

    for (var i = 1; i <= max_level; ++i) {
      if (i == max_level && level % 2 == 0)
        spells_known[i] = 4;
      else if (i == max_level)
        spells_known[i] = 2;
      if (i == 1 && level > 1)
        spells_known[i] = 8;
      else if (i == 1)
        spells_known[i] = 6;
      if (i > 1 && i < max_level)
        spells_known[i] = 4;
    }
    if (level > 18) {
      if (level == 19)
        spells_known[9] = 6;
      else
        spells_known[9] = 8;
    }
    // add in spells for wealth modifier
    for (var i = 1; i <= max_level; ++i) {
      if (level % 2 == 0) {
        if (income === 'rich')
          spells_known[i] += 2;
        if (income === 'wealthy')
          spells_known[i] += 1;
        else if (income === 'poor')
          spells_known[i] -= 1;
      }
      if (income === 'rich')
        spells_known[i] += 2;
      if (income === 'wealthy')
        spells_known[i] += 1;
    }

    // now, pick random spells from the json.
    // each spell must be for the correct class,
    // and for the correct level
    var school = $('#school').val().toLowerCase();
    var rarity = $('#rarity').val().toLowerCase();
    var sources = $('#sourcesButton').val();

    strout += "<div class=\"row\">";
    for (var i = 1; i <= max_level; ++i) {
      strout += "<div class=\"flex-item\" id=\"div" + i + "\">"
        + "<h3>Rank " + i + " spells</h3>"
        ;

      // first two spells should be from school
      for (var j = 0; j < spells_known[i]; ++j) {
        // get random spell for current
        // spell level 'i'
        var found = false;
        var curr_spell;
        // search for valid spell.
        // quit after 100 searches
        var quit = 0;
        while (!found) {
          curr_spell = randSpell(i);

          found = validate_spell(curr_spell);

          if (found) {
            if (school !== 'none') {
              if (j < 2 && !curr_spell.system.traits.value.includes(school)) {
                found = false;
              }
            }
          }
          if (quit++ > 100)
            found = true;

          if (found)
            owned_spells.push(curr_spell);

        }
        strout += ""
          + "<div class='spell'>"
          + "<b>" + curr_spell.name + "</b>"
          + " (" + curr_spell.system.traits.value + ")"
          + " (" + curr_spell.system.traits.rarity + ")"
          + "<div class='well'>" + curr_spell.system.source.value + "</div>"
          + "<br>"
          + "</div>"
          ;
      }
      strout += "</div>";
    }
    strout += "</div>";
    // end of row
  }
  else {
    // return error
    strout += "Invalid level";
  }
  out.append(strout);
  return out;
}

// return json of random spell of given level
var randSpell = function(spell_level) {
  if (all_spell_list) {
    var found = false;
    var to_return;
    var emergency_shutoff = 0;
    while (!found && emergency_shutoff < 20) {
      var to_return = spell_list_by_level[spell_level][Math.floor(Math.random() * spell_list_by_level[spell_level].length)];
      if (to_return.name && to_return.system)
        found = true;
      else
        console.log("An object, but not one of ours?" + to_return);
      ++emergency_shutoff;
    }
    return to_return;
  }
  else {
    return "[{\"name\": \"spellbook\"},"
      + "{\"level\": \"not\"},"
      + "{\"school\": \"loaded\"}]";
  }
}

var validate_spell = function(spell) {
  var found = false;

  // check if the spell is already in the list
  if (!owned_spells) {
    owned_spells = [{}];
  }
  for (var key in owned_spells) {
    if (owned_spells[key].name === spell.name)
      return false;
  }

  // check if source is allowed
  // spell.system.source.value
  // TODO: Source book checking here

  // check if rarity is allowed
  switch (rarity) {
    case "unique":
      found = true;
      break;
    case "rare":
      if (spell.system.traits.rarity != "unique")
        found = true;
      else
        return false;
      break;
    case "uncommon":
      if (
        spell.system.traits.rarity == "uncommon"
        || spell.system.traits.rarity == "common"
      )
        found = true;
      else
        return false;
      break;
    case "common":
    default:
      if (spell.system.traits.rarity == "common")
        found = true;
      else
        return false;
      break;
  }

  return found;
}

$('#submit').on('click', function() {
  $('#my_spells').append(spellbook());
});

// read data.json and fill table
var allSpells = function() {

  if (all_spell_list) {
    var out = $('#all_spells');
    out.append("<table class=\"table table-striped\" id=\"table\">"
        + "<thead>"
        +	"<th>spell name</th>"
        +	"<th>level</th>"
        +	"<th>school</th>"
        + "</thead>"
        + "<tbody>"
        );

    for (var i = 0; i < all_spell_list.length; ++i) {
      $('#table').append("<tr><td>"
          + all_spell_list[i].name + "</td><td>"
          + all_spell_list[i].system.level + "</td><td>"
          + all_spell_list[i].system.traits.value + "</td><td>"
          + "</tr>"
          );
    }
    out.append("</tbody></table>");
  }
}

// load spell list into json
var all_spell_list;
var spell_list_by_level = [];
var all_source_books = [];

// Get spells from https://github.com/foundryvtt/pf2e/tree/master/packs/spells

$.getJSON("./json/P2ESpells.json", function(data) {
  all_spell_list = data;

  spell_list_by_level[1] = [{}];
  spell_list_by_level[2] = [{}];
  spell_list_by_level[3] = [{}];
  spell_list_by_level[4] = [{}];
  spell_list_by_level[5] = [{}];
  spell_list_by_level[6] = [{}];
  spell_list_by_level[7] = [{}];
  spell_list_by_level[8] = [{}];
  spell_list_by_level[9] = [{}];

  for (var i in all_spell_list) {

    // validate spell before adding to lists
    if (!(
      all_spell_list[i].system
      && all_spell_list[i].system.traditions 
      && all_spell_list[i].system.traditions.value.includes("arcane")
      && all_spell_list[i].system.traits
      && all_spell_list[i].system.traits.value
      && all_spell_list[i].system.source
      && all_spell_list[i].system.source.value
      ))
      continue;
    
    // add source book of the spell
    if (!all_source_books.includes(all_spell_list[i].system.source.value))
      all_source_books.push(all_spell_list[i].system.source.value)

    switch (all_spell_list[i].system.level.value) {
      case 1:
        spell_list_by_level[1].push(all_spell_list[i]);
        break;
      case 2:
        spell_list_by_level[2].push(all_spell_list[i]);
        break;
      case 3:
        spell_list_by_level[3].push(all_spell_list[i]);
        break;
      case 4:
        spell_list_by_level[4].push(all_spell_list[i]);
        break;
      case 5:
        spell_list_by_level[5].push(all_spell_list[i]);
        break;
      case 6:
        spell_list_by_level[6].push(all_spell_list[i]);
        break;
      case 7:
        spell_list_by_level[7].push(all_spell_list[i]);
        break;
      case 8:
        spell_list_by_level[8].push(all_spell_list[i]);
        break;
      case 9:
        spell_list_by_level[9].push(all_spell_list[i]);
        break;
    }
  }
} )
.fail(function(jqxhr, textStatus, error) {
  // console.log("error");
  var err = textStatus + ", " + error;
  console.log("Request failed: " + err);
})
;