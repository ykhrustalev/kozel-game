define([
  "backbone",
  "templates",
  "bootstrap"
], function (Backbone, Templates) {

  "use strict";

  /**
   * Base view class for the application. Overrides the render method and
   * requires that any derived class provide value for the `tpl` property.
   * @see `render` method for details
   */
  return Backbone.View.extend({

    // base binding DOM node for application views
    el : "",

    // template name to use
    tpl: "",

    initialize: function () {
      this._isRendered = false;
    },

    /**
     * Cleans resources and releases binds for the view-model.
     * Should be called on view life end.
     */
    close: function () {
      this.beforeClose && this.beforeClose();
      this.off();
      this.afterClose && this.afterClose();
      this._isRendered = false;
    },

    renderTemplate: function (templateName, data, partials) {
      return Templates[templateName].render(data, partials);
    },

    getTemplate: function (templateName) {
      return Templates[templateName]
    },

    /**
     * Uses Hogan library for templates rendering. Requires `tpl`
     * property defined in view.
     * @return `this`
     */
    render: function (options) {
      var self = this;

      options = options || {};

      if (this.isRendered() && self.partialRender) {
        self.partialRender(options);
        return this;
      }

      var html = this.renderTemplate(this.tpl, this.getData(), this.getPartials());
      self.beforeRender && this.beforeRender();
      if (!options.animate) {
        self.$el.html(html);
        self._isRendered = true;
        self.afterRender && self.afterRender();
      } else {
        self.$el.fadeOut('fast', function () {
          self.$el.html(html);
          self.$el.fadeIn('fast');
          self._isRendered = true;
          self.afterRender && self.afterRender();
        });
      }

      return this;
    },

    isRendered: function () {
      return this._isRendered;
    },

    /**
     * Derives data from view's binding to model
     * @return {*}
     */
    getData: function () {
      return this.model ? this.model.toJSON() : this.collection ? this.collection.toJSON() : {};
    },

    getPartials: function () {
      return {};
    }

  });
});
