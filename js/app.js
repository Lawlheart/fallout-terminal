angular.module('FalloutConsole', [])

.controller('MainController', ['$scope', '$http', function($scope, $http) {
  $http.get('js/words.json').success(function(data) {
    $scope.words = data;

    $scope.gamestate = 'landing';
    //configuration variables
    var difficulty = 5;
    var lineLength = 12;
    var lines = 34;
    var characters = lineLength * lines;
    var margin = 2;
    var words, secretWord, places, display;

    function random(min, max) {
      return Math.floor(Math.random() * (max - min + 1) + min);
    }
    //randomizes word locations, returns 2d array with paired index and word
    function findPlaces(words, difficulty, characters, margin) {
      var places = [];
      var placed = false;
      var blacklist = [];
      for(var i = 0; i < words.length; i++) {
        placed = false;
        while(!placed && blacklist.length < characters * 0.8) {
          var place = Math.floor(Math.random()*(characters - difficulty));
          //check blacklist array to make sure there isn't a word conflict
          if(blacklist.indexOf(place) < 0) {
            places.push([place, words[i]]);
            placed = true;
            //add used spaces with margin to blacklist array
            for(var j = place - difficulty - margin; j <= place + margin + difficulty; j++) {
              blacklist.push(j);
            }
          }
        }
      }
      return places.sort(function(a, b) { return a[0] - b[0];});
    }
    //randomizes junk characters, creating the full grid
    function generateDisplay(places, difficulty, characters) {
      places = places.slice(0);
      var display = '';
      for(var i = 0; i < characters; i++) {
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
      return fillers[random.toString()];
    }
    //takes the whole code string and breaks it into lines
    function renderScreen(display, lines, lineLength) {
      var screen = [];
      for(var i = 0; i < lines; i++) {
        screen.push(display.slice(0, lineLength));
        display = display.slice(lineLength);
      }
      return screen;
    }
    function renderWords(places, difficulty) {
      for(var i=0;i<places.length;i++) {
        var position = parseInt(places[i][0])
        for(var j=position;j<position + difficulty;j++) {
          var index = $('.code-line pre.data').eq(j);
          index.addClass('word');
          index.addClass(places[i][1]);
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
      return hacks
    }
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
        for(var i = $scope.number; i <= hack[0][1]; i++) {
          $('.code-line pre.data').eq(i).addClass('selected')
          $('#selection').html("> " + hack[0][2])
        }
      }
    }
    // prints a output to the terminal sidebar
    function printLine(line) {
      $scope.sidebar.shift();
      $scope.sidebar.push(line);
    }
    // runs hack function, removing duds or resetting tries
    function hack() {
      var hackIndex;
      var hack = $scope.hacks.filter(function(h, i) {
        if(h[0] == $scope.number) {
          hackIndex = i;
          return true;
        }
        return false;
      });
      printLine(hack[0][2]);
      if($scope.triesReset[0] === $scope.number) {
        $scope.boxes = [1, 2, 3, 4];
        printLine('Tries Reset.');
      } else {
        removeBadWord();
        printLine('Dud Removed.');
      }
      $scope.hacks.splice(hackIndex, 1);
      $('.code-line pre.data').eq($scope.number).removeClass('hack');
      $scope.$apply();
    }
    // removes dud
    function removeBadWord() {
      var badWords = words.slice(0, words.indexOf(secretWord)).concat(words.slice(words.indexOf(secretWord) + 1));
      var removedWord = badWords[random(0, badWords.length - 1)];
      words.splice(words.indexOf(removedWord), 1);
      $("." + removedWord).addClass('dud').removeClass('word').removeClass(removedWord).html(".");
    }
    // gets character likeness
    function getLikeness(word, secretWord) {
      var likeness = 0;
      for(var i=0;i<word.length;i++) {
        if(word[i] === secretWord[i]) {
          likeness ++;
        }
      }
      return likeness;
    }
    // character guess
    function guess() {
      var selected = $('.code-line pre.data').eq($scope.number);
      var currentWord = selected[0].className.slice(21, 21 + difficulty);
      if(currentWord === secretWord) {
        printLine("Password Accepted.");
        $scope.gamestate = 'game-win';
      } else {
        $scope.boxes.pop();
        if($scope.boxes.length === 0) {
          printLine('Lockout');
          $scope.gamestate = 'game-over';
        } else {
          printLine(currentWord);
          printLine("Entry denied.");
          printLine("Likeness=" + getLikeness(currentWord, secretWord));
        }
      } 
      $scope.$apply();
    }
    function getWords(secretWord) {
      var word, likeness;
      var wordset = $scope.words[difficulty];
        var words = [secretWord];
        for(var i=0;i<15;i++) {
          var count = 0;
          do {
            word = wordset[random(0, wordset.length - 1)];
            likeness = getLikeness(word, secretWord);
            count ++;
            if(words.indexOf(word) < 0 && count > 100) {
              break;
            } else if(words.indexOf(word) < 0 && count > 50 && likeness > 1) {
              break;
            }
          } while(words.indexOf(word) >=0 || likeness < 3);
          words.push(word);
        }
      return words;
    }
    $scope.initialize = function() {
      var wordset = $scope.words[difficulty];
      secretWord = wordset[random(0, wordset.length - 1)];
      words = getWords(secretWord);
      
      console.log(secretWord)
      places = findPlaces(words, difficulty, characters, 2);
      display = generateDisplay(places, difficulty, characters);
      $scope.screen = renderScreen(display, lines, lineLength);

      //view variables
      $scope.left = $scope.screen.slice(0,17);
      $scope.right = $scope.screen.slice(17,34);
      $scope.boxes = [1,2,3,4];
      $scope.sidebar = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
      $scope.number = 0;

      setTimeout(function() {
        changeSelection($scope.number)
        renderWords(places, difficulty)
        $scope.hacks = renderHacks($scope.screen);
        $scope.triesReset = $scope.hacks[random(0, $scope.hacks.length - 1)];
      }, 200);
        $scope.gamestate = 'playing';
    }

    //keydown event handler to manage cursor
    $('body').keydown(function(e) {
      if([13, 37, 38, 39, 40].indexOf(e.keyCode) >= 0) {
        e.preventDefault();
        if($scope.gamestate !== 'playing') {
          $scope.initialize();
          $scope.$apply();
          return
        }
      }
      

      var num = $scope.number
      var previous = $('.code-line pre.data').eq(num);
      //keypress right, if not max number
      if(e.keyCode === 39 && num < 407) {

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


      //keypress enter
      } else if(e.keyCode === 13) {
        var selected = $('.code-line pre.data').eq(num);
        if(selected.hasClass('hack')) {
          hack();
        } else if(selected.hasClass('word')) {
          guess();
        } else {
          $scope.boxes.pop();
          printLine(selected.html());
          printLine('Error');
          if($scope.boxes.length === 0) {
            printLine('Lockout');
            $scope.gamestate = 'game-over';
          }
          $scope.$apply();
        }
      }

      changeSelection($scope.number);
    });
  });
}]);
