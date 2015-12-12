angular.module('FalloutConsole', [])

.controller('MainController', ['$scope', function($scope) {
	var words = [ 'SPIES', 'JOINS', 'TIRES', 'TRICK', 'TRIED', 'SKIES', 'TERMS', 'THIRD', 'FRIES', 'PRICE', 'TRIES', 'TRITE', 'TANKS', 'THICK', 'TRIBE', 'TEXAS' ];

	var debugging = false;
	function debug(message, message2) {
		if(debugging && message2 !== undefined) {
			console.log(message, message2);
		} else if(debugging) {
			console.log(message)
		}
	}

	//randomizes word locations, returns 2d array with paired index and word
	function findPlaces(words, difficulty, characters, margin) {
		var places = [];
		var placed = false;
		var blacklist = [];
		for(var i = 0; i < words.length; i++) {
			debug(blacklist.sort())
			placed = false;
			debug('placing ' + words[i]);
			while(!placed && blacklist.length < characters * 0.8) {
				var place = Math.floor(Math.random()*(characters - difficulty));
				//check blacklist array to make sure there isn't a word conflict
				if(blacklist.indexOf(place) < 0) {
					debug('no conflict, placing at ' + place);
					places.push([place, words[i]]);
					placed = true;
					//add used spaces with margin to blacklist array
					for(var j = place - difficulty - margin; j <= place + margin + difficulty; j++) {
						blacklist.push(j);
					}
				} else { 
					debug('overlap conflict, rerolling');
				}
			}
			debug(places)
		}
		debug("PLACED " + places.length + " of " + words.length + " Words")
		return places.sort(function(a, b) { return a[0] - b[0];});
	}

	//randomizes junk characters, creating the full grid
	function generateDisplay(places, difficulty, characters) {
		var display = '';
		for(var i = 0; i < characters; i++) {
			if(i%10 === 0) {debug("new chunk");}
			if(places.length > 0 && i === places[0][0]) {
				display += places[0][1];
				i += difficulty - 1;
				places.shift();
			} else {
				display += randomChar();
			}
		}
		return display;
	}

	//gives a random filler character
	function randomChar() {
		var fillers = {
			'1':'(',
			'2':')',
			'3':'<',
			'4':'>',
			'5':'{',
			'6':'}',
			'7':'[',
			'8':']',
			'9':'=',
			'10':'_',
			'11':'-',
			'12':'.',
			'13':'/',
			'14':'$',
			'15':'@',
			'16':';',
			'17':':',
			'18':'"',
			'19':'%',
			'20':'^',
			'21':'&',
			'22':'|',
			'23':',',
			'24':'*'
		};
		var random = Math.floor(Math.random()*24 + 1);
		// debug(random, fillers[random.toString()]);
		return fillers[random.toString()];
	}

	//takes the whole code string and breaks it into lines
	function renderScreen(display, lines, lineLength) {
		var screen = [];
		for(var i = 0; i < lines; i++) {
			screen.push(display.slice(0, lineLength));
			display = display.slice(lineLength);
		}
		debug(screen);
		return screen;
	}


	function renderWords(wordKey, difficulty) {
		debug('adding word class to words, iterating:')
		debug('renderWords input: ' + wordKey + difficulty)
		for(var i=0;i<wordKey.length;i++) {
			var position = parseInt(wordKey[i][0])
			for(var j=position;j<position + difficulty;j++) {
				var index = $('.code-line pre.data').eq(j);
				debug(j, index)
				index.addClass('word');
				index.addClass(wordKey[i][1]);
			}
		}	
	}

	var difficulty = 5;
	var lineLength = 12;
	var lines = 34;
	var characters = lineLength * lines;
	var margin = 2;
	var wordKey = [];

	var places = findPlaces(words, difficulty, characters, 2);
	for(var i=0;i<places.length;i++) {
		wordKey.push(places[i]);
	}
	debug(places)
	display = generateDisplay(places, difficulty, characters);
	debug(display)
	$scope.screen = renderScreen(display, lines, lineLength);


	debug("screen length: ", $scope.screen.length);
  $scope.left = $scope.screen.slice(0,17);
  $scope.right = $scope.screen.slice(17,34);
  $scope.attempts = 4;
  $scope.boxes = [1,2,3,4];
  $scope.sidebar = []
  $scope.selection ='TEST';
  $scope.number = 0;

  //function to handle selection highlighting
  function changeSelection(num) {
  	$('.selected').removeClass('selected');
  	var selected = $('.code-line pre.data').eq(num);
	  selected.addClass('selected');
	  $('#selection').html(">" + selected.html())
	  if(selected.hasClass('word')) {
	  	// class is 'data ng-binding word TIRES selected', 21 gets to start of word in this order
	  	var currentWord = selected[0].className.slice(21, 21 + difficulty);
	  	$('.' + currentWord).addClass('selected')
	  }
  }



  //initializes the cursor to point 0
  $(document).ready(function() {
  	changeSelection($scope.number)
		renderWords(wordKey, difficulty)
  	});

  //keydown event handler to manage cursor
  $('body').keydown(function(e) {
  	debug('keypress');
  	e.preventDefault();
  	var num = $scope.number

  	//keypress right, if not max number
  	if(e.keyCode === 39 && num < 407) {
  		debug('keypress right');
  		//checks if end of row to move to other collumn
  		if(num < 204 && (num + 1) % 12 === 0 ) {
  			$scope.number += 193;
  		} else {
	  		$scope.number += 1;
  		}

		//keypress left, if not first number
  	} else if(e.keyCode === 37 && num > 0) {
  		debug('keypress left');  		
  		//checks if end of row to move to other collumn
  		if(num > 203 && (num + 1) % 12 === 1 ) {
  			$scope.number -= 193;
  		} else {
	  		$scope.number -= 1;
  		}

  	//keypress up, if not first row
  	} else if(e.keyCode === 38 && num > 11) {
  		$scope.number -= 12;

  	//keypress down, if not last row
  	} else if(e.keyCode === 40  && num < 396) {
  		$scope.number += 12;
  	}

  	changeSelection($scope.number);
  });
}]);
