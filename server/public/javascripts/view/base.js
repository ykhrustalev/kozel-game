define([
  "backbone",
  "templates",
  "backboneValidation",
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
    },

    /**
     * Cleans resources and releases binds for the view-model.
     * Should be called on view life end.
     */
    close: function () {
      if (this.onClose) {
        this.onClose();
      }
      this.unbind();
      if (this.model) {
        Backbone.Validation.unbind(this);
      }
    },

    /**
     * Uses Hogan library for templates rendering. Requires `tpl`
     * property defined in view.
     * @return `this`
     */
    render: function (animate) {
      this.beforeRender && this.beforeRender();

      var template = Templates[this.tpl];
      var self = this;

      if (!animate) {
        self.$el.html(template.render(self.getData()));
      } else {
        self.$el.fadeOut('fast', function () {
          self.$el.html(template.render(self.getData()));
          self.$el.fadeIn('fast');
        });
      }

      this.afterRender && this.afterRender();

      return this;
    },

    /**
     * Derives data from view's binding to model
     * @return {*}
     */
    getData: function () {
      return this.model ? this.model.toJSON() : {};
    }

  });
});
