const MAXPOKEMON = 12;

let pokeApp = {};

pokeApp.baseAPI = "http://pokeapi.co/api/v2/pokemon/";
pokeApp.pokemonInfoList = []; // This holds all the pokemon information (name, url, weight and height)

pokeApp.userSubject = ""; // What the user wants to see (height or weight)
pokeApp.userValue = ""; 
pokeApp.userSystem = ""; // By default displays in metric (kg/m)

pokeApp.currentProgress = 0;
pokeApp.reuseState = false;

//Initializing the pokemon app
pokeApp.init = () => {
	pokeApp.setBackground();
	pokeApp.event();
};

pokeApp.event = () => {
	$("form").on("submit", (e) => {
		// Event listener for form submission
		e.preventDefault();
		$(".modal").fadeIn(400); // Fade the modal in
		pokeApp.storeUserValues(); // Grabs the user entered values
		pokeApp.checkInfo(); // Checks if the pokemon information has been saved to the browser
		$(".userForm").fadeOut(400);
	}); // END OF FORM SUBMIT EVENT

	$(".retry").on("click",function(e) {
		// Event listener to restart
		e.preventDefault();
		pokeApp.resetModal();
	});

	$("input[type=radio][name=subject]").on("change", (e) => {

		if (e.target.value === "weight") {
			//remove class hidden from weight add class hidden to height
			$("#tipHeight").addClass('hidden');
			$("#tipWeight").removeClass('hidden');
			$(".questionSetSubject").text("weight");
		} else if (e.target.value === "height") {
			//remove class hidden from height add class hidden to weight
			$("#tipWeight").addClass('hidden');
			$("#tipHeight").removeClass('hidden');
			$(".questionSetSubject").text("height");
		}
	});

	$("input[type=radio][name=system]").on("change", (e) => {
		if (e.target.value === "metric") {
			$(".questionSetImperial").addClass("hidden");
			$(".questionSetMetric").removeClass("hidden");
		} else if (e.target.value === "imperial") {
			$(".questionSetImperial").removeClass("hidden");
			$(".questionSetMetric").addClass("hidden");
		}
	});




};


pokeApp.storeUserValues = () => {
	// Grabs the user entered values
	pokeApp.userSystem = $("input[name=system]:checked").val();
	pokeApp.userSubject = $("input[name=subject]:checked").val();
	pokeApp.userValue = $("input[name=userValue]").val();
	if (pokeApp.userSystem === "imperial" && pokeApp.userSubject === "weight") {
		pokeApp.userValue = pokeApp.userValue * 0.4535923; // converting lbs to kg
	} else if (pokeApp.userSystem == "imperial" && pokeApp.userSubject === "height") {
		pokeApp.userValue = pokeApp.userValue * 2.54; // converting inches to cm
	};
}


pokeApp.checkInfo = () => {
	// Checks if the pokemon information has been saved to the browser
	if (pokeApp.reuseState === false) {
		$.when(pokeApp.getAllPokemon)
		.done((allPokemon) => {
			//When the promise is done, store all pokemon height/weight information
			pokeApp.storePokemonInfo(allPokemon.results);
		}); // End of pokeApp.getAllPokemon promise
		pokeApp.reuseState = true;
	} else { // If information is already stored, sort the pokemon list by selected subject and compare
		pokeApp.sortThenCompare();
	};	//END of If statement
}


pokeApp.sortThenCompare = () => {
	pokeApp.sortPokemonList(pokeApp.userSubject);
	pokeApp.compareUserToPokemon(pokeApp.userSubject,pokeApp.userValue);
}

pokeApp.sortPokemonList = (subject) => { // sorts pokemon by subject (subject being height or weight)
	pokeApp.pokemonInfoList.sort(function(a, b) {
		return parseFloat(a[subject]) - parseFloat(b[subject]);
	});
}



pokeApp.getAllPokemon = $.ajax({
	// AJAX call to Pokemon API to get list of pokemon and EP
	url: pokeApp.baseAPI,
	method: "GET",
	dataType: "JSON",
	data: {
		limit: 50
	}
});


pokeApp.pokemonProgress = () => {
	pokeApp.currentProgress = ( (pokeApp.pokemonInfoList.length)/ MAXPOKEMON) * 100; //This is calculating the current pokemon out of MAXPOKEMON which has been loaded to give a progress %

	$("#modal__loading__myProgress__myBar").css("width",pokeApp.currentProgress + "%"); // Progress percentage is updated to the width of the bar to give a visual indication
	$("#currentProgress").text(pokeApp.currentProgress.toFixed(2) + "%"); // Updating "#currentProgress" to display progress on HTML
}

pokeApp.storeIndividualPokemon = (currentPokemon) => {
	// Stores each pokemon and their stats
	let pokemonInfo = {
		// Initializing the pokemonInfo object with a structure and storing the values
		name: currentPokemon.forms[0].name,
		id: currentPokemon.id,
		height: currentPokemon.height*10, //height is in cm
		weight: currentPokemon.weight/10 //weight is in kg
	}; // End of pokemonInfo structure

	pokeApp.pokemonInfoList.push(pokemonInfo); // Pushes the pokemonInfo object into the "pokemonInfoList" array

	pokeApp.pokemonProgress(); // Used to display the loading bar

	if(pokeApp.pokemonInfoList.length === MAXPOKEMON) { // This condition is set to know when all the pokemon information have been stored
		$(".modal__loading").fadeOut(0, () => {
			//Once the modal loading has disappeared, fade in the results and retry button
			$(".modal__results").removeClass("hidden");
			$(".retry").removeClass("hidden");
		}); // Hiding the loading bar as it has reached 100%;
		// Need to sort all the pokemon information by user selected subject (weight/height)
		pokeApp.sortThenCompare();
	} // END of if statement
};

pokeApp.storePokemonInfo = (results) => { //"results" is the array of pokemon with name and EP
	$(".modal__loading").fadeToggle(100); // Reveals loading bar AFTER Submit is pressed for first time
	for(let i = 0; i < MAXPOKEMON; i++) {
		//This for loop runs through the list and stores the height and weight into an array (height and weight are converted to m and kg)
		pokeApp.getEachPokemon = $.ajax({
			// AJAX call to get each individual pokemon ("i" indicates the current pokemon number)
			url: results[i].url,
			method: "GET",
			dataType: "JSON"
		});
		$.when(pokeApp.getEachPokemon) //START of the promise
		.done((currentPokemon) => {
			pokeApp.storeIndividualPokemon(currentPokemon); //
		}); // END of the promise
	} // end of the for loop
};

pokeApp.compareUserToPokemon = (subject, value) => {
	let convertedUnder = 0;
	let convertedOver = 0;
	let pokemonUnder = 0;
	let pokemonOver = 0;
	let pokemonEven = 0;
	let lastPokemon = pokeApp.pokemonInfoList.length - 1;
	let unit = "";

	if (pokeApp.userSubject === "weight") {
		if (pokeApp.userSystem === "metric") {
			unit = "kg";
		} else if (pokeApp.userSystem === "imperial") {
			unit = "lbs";
		}
	} else if (pokeApp.userSubject === "height") {
		if (pokeApp.userSystem === "metric") {
			unit = "cm";
		} else if (pokeApp.userSystem === "imperial") {
			unit = "inches";
		}
	}



	let i = 0;
	do{
		// Runs a loop through all the pokemon to determine which one is higher and lower than the user
		let currentPokemonValue = pokeApp.pokemonInfoList[i][pokeApp.userSubject];

		if (currentPokemonValue == value) { // if even
			pokemonEven = i;
			break;
		} else if (currentPokemonValue < value) { // if smaller than current user
			pokemonUnder = i;
		} else { // if it's not even or smaller, it has to be bigger
			pokemonOver = i;
			break;
		}
		i++;
	} while (i < pokeApp.pokemonInfoList.length);










	if (pokemonEven > 0) { // Condition if there is a pokemon who is the same as the user
		$(".modal__results").fadeIn(400,function() {
			$(".results__even").fadeIn(200);
			$(".retry").fadeIn(200);
		});

		$("#resultsEven__pokemonName").text(pokeApp.pokemonInfoList[pokemonEven].name);

		let pokeEvenImg = "images/pokemon/" + pokeApp.pokemonInfoList[pokemonEven].id + ".png";
		$(".results__even img").attr("src", pokeEvenImg);
		$(".resultsEven__pokemonValue").text(pokeApp.pokemonInfoList[pokemonEven][pokeApp.userSubject] + unit);
	} else if (value > pokeApp.pokemonInfoList[lastPokemon][subject]) { // Checks if you are taller/heavier than all the pokemon
		$(".modal__results").fadeIn(400,function() {
			$("#resultsOver").fadeIn(200);
			$(".retry").fadeIn(200);
		});

		$(".over").removeClass('hidden');

		let word = "";

		if (pokeApp.userSubject === "weight") {
			word = "heaviest";
		} else if (pokeApp.userSubject === "height") {
			word = "tallest";
		};

		$(".over span").text(word);


		$("#resultsOver__pokemonName").text(pokeApp.capitalizeName(pokeApp.pokemonInfoList[lastPokemon].name));

		convertedOver = pokeApp.convertValue(pokeApp.pokemonInfoList[lastPokemon][pokeApp.userSubject], pokeApp.userSystem).toFixed(2);
		$(".resultsOver__pokemonValue").text(convertedOver + unit);
		

		let pokeLastImg = "images/pokemon/" + pokeApp.pokemonInfoList[lastPokemon].id + ".png";
		$(".results__over img").attr("src", pokeLastImg);
	} else if (value < pokeApp.pokemonInfoList[0][subject]) { // Checks if user is smaller/lighter than all the pokemon
		$(".modal__results").fadeIn(400,function() {
			$("#resultsUnder").fadeIn(200);
			$(".retry").fadeIn(200);
		});

		$(".under").removeClass('hidden');

		let word = "";

		if (pokeApp.userSubject === "weight") {
			word = "lightest";
		} else if (pokeApp.userSubject === "height") {
			word = "shortest";
		};

		$(".under span").text(word);

		$("#resultsUnder__pokemonName").text(pokeApp.capitalizeName(pokeApp.pokemonInfoList[pokemonUnder].name));
		
		convertedUnder = pokeApp.convertValue(pokeApp.pokemonInfoList[pokemonUnder][pokeApp.userSubject], pokeApp.userSystem).toFixed(2);
		$(".resultsUnder__pokemonValue").text(convertedUnder + unit);

		let pokeUnderImg = "images/pokemon/" + pokeApp.pokemonInfoList[pokemonUnder].id + ".png";
		$(".results__under img").attr("src", pokeUnderImg);
	} else {

		$(".modal__results").fadeIn(400,function() {
			$("#resultsOver").fadeIn(200);
			$("#resultsUnder").fadeIn(200);
			$(".retry").fadeIn(200);
		});


		$(".between").removeClass('hidden');



		convertedUnder = pokeApp.convertValue(pokeApp.pokemonInfoList[pokemonUnder][pokeApp.userSubject], pokeApp.userSubject, pokeApp.userSystem).toFixed(2);
		convertedOver = pokeApp.convertValue(pokeApp.pokemonInfoList[pokemonOver][pokeApp.userSubject], pokeApp.userSubject, pokeApp.userSystem).toFixed(2);



		$(".resultsUnder__pokemonValue").text(convertedUnder + unit);
		$(".resultsOver__pokemonValue").text(convertedOver + unit);



		// Displays the pokemon who is taller/heavier than the user
		$("#resultsOver__pokemonName").text(pokeApp.capitalizeName(pokeApp.pokemonInfoList[pokemonOver].name));
		let pokeOverImg = "images/pokemon/" + pokeApp.pokemonInfoList[pokemonOver].id + ".png";
		$(".results__over img").attr("src", pokeOverImg);

		// Displays the pokemon who is shorter/lighter than the user
		$("#resultsUnder__pokemonName").text(pokeApp.capitalizeName(pokeApp.pokemonInfoList[pokemonUnder].name));
		let pokeUnderImg = "images/pokemon/" + pokeApp.pokemonInfoList[pokemonUnder].id + ".png";
		$(".results__under img").attr("src", pokeUnderImg);
	}; // End of if statement
}; // End of pokeApp.compareUserToPokemon



pokeApp.capitalizeName = (string) => {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

pokeApp.convertValue = (value, subject, system) => {
	if (system === "imperial") {
		if (subject === "height") {
			return value = value * 0.393701; // converted cm to inches
		} else if (subject === "weight") {
			return value = value * 2.20462; // converted kg to lbs
		}
	} else {
			return value;
	};
}


pokeApp.resetModal = () => { // Clears the form, fades the results modal out, and fades the question form back in

	$(".between").addClass('hidden');
	$(".over").addClass('hidden');
	$(".under").addClass('hidden');
	$(".results").addClass('hidden');

	$(".modal").fadeOut(100);
	$(".modal__results").fadeOut(100);
	$(".results__under").fadeOut(100);
	$(".results__over").fadeOut(100);
	$(".results__even").fadeOut(100);

	$(".results__under img").attr("src", "");
	$(".results__over img").attr("src", "");
	$(".results__even img").attr("src", "");

	$( "#imperial" ).prop( "checked", true );
	$( "#metric" ).prop( "checked", false );
	$( "#height" ).prop( "checked", false );
	$( "#weight" ).prop( "checked", true );
	$( "#userValue").val("");

	$(".retry").fadeOut(100,function() {
		$(".userForm").fadeIn(200);
	});


};

pokeApp.setBackground = () => { // Used to randomly generate pokemon in the background
	let numberOfPokemon = 75;
	const maxWindowWidth = (Math.max(document.documentElement.clientWidth, window.innerWidth || 0)) - 140; // Calculates max window width to put pokemon in
	const maxWindowHeight = (Math.max(document.documentElement.clientHeight, window.innerHeight || 0))-140; // Calculates max window height to put pokemon in

	for(let i = 0; i <= numberOfPokemon; i++) { // runs a loop to randomly generate 50 pokemon into the background
		let randomPositionX = Math.floor((Math.random() * maxWindowWidth) + 1);
		let randomPositionY = Math.floor((Math.random() * maxWindowHeight) + 1);
		let randomPokemon = Math.floor((Math.random() * 151) + 1);
		let randomPokemonSize = Math.floor((Math.random() * 150) + 100);

		$(".backgroundPokemon").append(`<img src="images/pokemon/${randomPokemon}.png" alt="image of a pokemon to decorate the background" class="pokemonBackground pokemon${i}">`);
		$(`.pokemon${i}`).height(randomPokemonSize).width(randomPokemonSize).css("position","fixed").css("top",randomPositionY).css("left",randomPositionX).css("z-index",-100);

	} // End of for loop
};



$(() =>{
	pokeApp.init();

});