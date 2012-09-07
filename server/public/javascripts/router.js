define([
  'backbone',
  'util/dispatcher',
  'view/dashboard',
  'view/game/new',
  'io'
], function(Backbone, dispatcher, dashboard, newGame, io) {

  'use strict';

  var AppRouter = Backbone.Router.extend({

    routes: {
      '': 'showDashboard',
      'new': 'showNewGame',
      'contest/:id': 'showGame',

      // Default
      '*actions': 'showDashboard'
    },

    showDashboard: function() {
      this.setView(dashboard);
    },

    showNewGame: function() {
      this.setView(newGame);
    },

    showGame: function(id) {

      console.log('game ' + id);
//      contest.render();
    },

    setView: function(view) {
      if (this.activeView) {
        this.activeView.close();
      }
      this.activeView = view;
      view.render();
    }


  });

  var initialize = function() {
    var appRouter = new AppRouter;
    Backbone.history.start();

    dispatcher.on('game:created', function(contest) {
      appRouter.navigate("", {trigger: true});
    });

    // TODO: remove
    var socket = io.connect('http://localhost');
    socket.on('game:list', function (data) {
      console.log(data);
    });
    socket.on('news', function (data) {
      console.log('socket data');
      console.log(data);
      socket.emit('my other event', { my: 'data' });
    });

//    console.log(window.location.search);

    /*
    var data = window.location.search.slice(1);
    $.ajax({
      url: '/login/',
      data: data,
//      type: 'json',
      success: function(response){
        console.log(response);
        $.ajax(response);
      }
    });
    */

  };

  return { initialize: initialize };
});