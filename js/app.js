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

	function renderHacks(lines) {
		var openers = ['(', '[', '{', '<'];
		var closers = [')', ']', '}', '>'];
		var hacks = []
		var index = 0
		//iterates over each line to find matching <>
		for(var i=0;i<lines.length;i++) {
			for(var j=0;j<lines[i].length;j++) {
				var letter = lines[i][j]
				if(openers.indexOf(letter) >= 0) {
					var brIndex = openers.indexOf(letter);
					var str = lines[i].slice(j);
					if(str.indexOf(closers[brIndex]) > 0) {
						var endIndex = str.indexOf(closers[brIndex]);
						snippet = str.slice(0, endIndex+1);
						var re = /[A-Z]/g
						if(re.test(snippet)) {
						} else {
							hacks.push([index, index + endIndex, snippet])
							$('.code-line pre.data').eq(index).addClass('hack')
						}
					}
				}
				index += 1
			}
		}
		console.log(hacks)
		return hacks
	}

	//configuration variables
	var difficulty = 5;
	var lineLength = 12;
	var lines = 34;
	var characters = lineLength * lines;
	var margin = 2;
	var wordKey = [];

	var places = findPlaces(words, difficulty, characters, 2);
	debug(places) // array of number, word pairs for the locations of words

	//copies word locations for later logic
	for(var i=0;i<places.length;i++) {
		wordKey.push(places[i]);
	}

	display = generateDisplay(places, difficulty, characters);
	debug(display) // 408 letter string, whole puzzle
	$scope.screen = renderScreen(display, lines, lineLength);
	debug($scope.screen) // should be 1x34 array of 12 letter strings, rows

	//view variables
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
	  $('#selection').html("> " + selected.html())

	  //if a letter in a word is selected, highlights and selects the whole word, as expected
	  if(selected.hasClass('word')) {
	  	// class is 'data ng-binding word TIRES selected', 21 gets to start of word in this order
	  	var currentWord = selected[0].className.slice(21, 21 + difficulty);
	  	$('.' + currentWord).addClass('selected')
	  	$('#selection').html("> " + currentWord)
	  }
	  if(selected.hasClass('hack')) {
	  	var hack = $scope.hacks.filter(function(h, i) {
	  		return h[0] == $scope.number;
	  	})
	  	for(var i = $scope.number; i < hack[0][1] + 1; i++) {
	  		$('.code-line pre.data').eq(i).addClass('selected')
	  		$('#selection').html("> " + hack[0][2])
	  	}
	  }
  }



  //initializes the cursor to point 0, adds classes to words
  $(document).ready(function() {
  	changeSelection($scope.number)
		renderWords(wordKey, difficulty)
		$scope.hacks = renderHacks($scope.screen)
  	});

  //keydown event handler to manage cursor
  $('body').keydown(function(e) {
  	debug('keypress');
  	e.preventDefault();
  	var num = $scope.number
  	var previous = $('.code-line pre.data').eq(num);
  	//keypress right, if not max number
  	if(e.keyCode === 39 && num < 407) {
  		debug('keypress right');

  		//checks if inside a word, if so, moves to the end of the word
  		if(previous.hasClass('word')) {
  			var inWord = true;
  			while(inWord && $scope.number < 407) {
  				$scope.number += 1;
  				var current = $('.code-line pre.data').eq($scope.number)
  				if(!current.hasClass('word')) {
  					inWord = false;
  				}
  			} 

  		//checks if end of row to move to other collumn
  		} else if(num < 204 && (num + 1) % 12 === 0 ) {
  			$scope.number += 193;
  		//otherwise, moves left
  		} else {
	  		$scope.number += 1;
  		}

		//keypress left, if not first number
  	} else if(e.keyCode === 37 && num > 0) {
  		debug('keypress left');  		

  		//checks if inside a word is selected, if so moves to the end of the word
  		if(previous.hasClass('word')) {
  			var inWord = true;
  			while(inWord && $scope.number > 0) {
  				$scope.number -= 1;
  				var current = $('.code-line pre.data').eq($scope.number)
  				if(!current.hasClass('word')) {
  					inWord = false;
  				}
  			} 

  		//checks if end of row to move to other collumn
  		} else if(num > 203 && (num + 1) % 12 === 1 ) {
  			$scope.number -= 193;
  		//otherwise, moves left
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
