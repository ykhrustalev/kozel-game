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
    render: function () {
      if (this.onRender) {
        this.onRender();
      }
      var template = Templates[this.tpl];
      this.$el.html(template.render(this.getData()));

      if (this.model) {

        // validation rendering
        Backbone.Validation.bind(this, {
          valid  : function (view, attr) {
            view.$el.find(".group-" + attr).removeClass("error");
            view.$el.find(".validation-" + attr).html("").hide();
          },
          invalid: function (view, attr, error) {
            view.$el.find(".group-" + attr).addClass("error");
            view.$el.find(".validation-" + attr).html(error).show();
          }
        });

      }

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
