define([
  "backbone",
  "templates",
  "backboneValidation", //TODO: remove dependency
  "bootstrap"
], function (Backbone, Templates) {

  "use strict";

  // force models to be updated with failed validation values
  Backbone.Validation.configure({
    forceUpdate: true
  });

  /**
   * Base view class for the application. Overrides the render method and
   * requires that any derived class provide value for the `tpl` property.
   * @see `render` method for details
   */
  return Backbone.View.extend({

    // base binding DOM node for application views
    el : "#container",

    // template name to use
    tpl: "",

    _modelBinder: undefined,

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
      options = options || {};
      var self = this;
      this.beforeRender && this.beforeRender();

//      if (this.isRendered()) {
//        self.partialRender();
//      } else {
        var html = this.renderTemplate(this.tpl, this.getData(), this.getPartials());
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
//      }

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
