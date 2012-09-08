define([
  'backbone',
  'util/dispatcher',
  'view/dashboard',
  'view/game/new',
  'util/socket'
], function(Backbone, dispatcher, dashboard, newGame, socket) {

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
      this.setPage(dashboard);
    },

    showNewGame: function() {
      this.setPage(newGame);
    },

    showGame: function(id) {

      console.log('game ' + id);
//      contest.render();
    },

    setPage: function(view) {
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

    dispatcher.on('view:update', function(view) {
      // TODO: make it general
      if (view =='dashboard' && appRouter.activeView.tpl) {
        appRouter.setPage(appRouter.activeView);
        console.log();
      }
    });

    // TODO: remove

    socket.on('news', function (data) {
      console.log('socket data');
      console.log(data);
      socket.emit('my other event', { my: 'data' });
    });

  };

  return { initialize: initialize };
});