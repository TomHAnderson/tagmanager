var TagManager = (function () {
    function TagManager(element, options) {
        var defaults = {
            strategy: 'array',
            tagFieldName: 'tags[]',
            ajaxCreate: null,
            ajaxDelete: null,
            initialCap: true,
            backspaceChars: [
                8
            ],
            delimiterChars: [
                13, 
                44, 
                188
            ],
            createHandler: function (tagManager, tag, isImport) {
                return;
            },
            deleteHandler: function (tagManager, tag, isEmpty) {
                return;
            },
            createElementHandler: function (tagManager, tagElement, isImport) {
                tagManager.$element.before(tagElement);
            },
            validateHandler: function (tagManager, tag, isImport) {
                return tag;
            }
        };
        this.$element = $(element);
        this.tagIds = [];
        this.tagStrings = [];
        var hat = require('hat');
        this.rack = hat.rack();
        this.options = $.extend({
        }, defaults, options);
        $(element).data('tagmanager', this);
        this.listen();
    }
    TagManager.prototype.keypress = function (e) {
        if($.inArray(e.which, this.options.backspaceChars) != -1) {
            if(!this.$element.val()) {
                e.preventDefault();
                this.pop();
            }
        }
        if($.inArray(e.which, this.options.delimiterChars) != -1) {
            e.preventDefault();
            e.stopPropagation();
            if(this.$element.data('typeahead') && this.$element.data('typeahead').shown && this.$element.data('typeahead').$menu.find('.active').length) {
                return false;
            }
            this.create(this.$element.val());
        }
    };
    TagManager.prototype.empty = function () {
        var manager = this;
        $(this.tagIds).each(function (index, value) {
            manager.delete(value, true);
        });
    };
    TagManager.prototype.pop = function () {
        if(this.tagIds.length > 0) {
            this.delete(this.tagIds[this.tagIds.length - 1]);
        }
    };
    TagManager.prototype.delete = function (tagId, isEmpty) {
        var tagString = $('#' + tagId).attr('tag');
        if(this.options.deleteHandler) {
            this.options.deleteHandler(this, tagString, isEmpty);
        }
        if(this.options.strategy = 'ajax' && this.options.ajaxDelete && !isEmpty) {
            $.ajax({
                url: this.options.ajaxDelete,
                type: 'post',
                data: {
                    tag: tagString
                },
                dataType: 'json'
            });
        }
        var index = $.inArray(tagId, this.tagIds);
        this.tagStrings.splice(index, 1);
        this.tagIds.splice(index, 1);
        $('#' + tagId).remove();
    };
    TagManager.prototype.import = function (tags) {
        var manager = this;
        $.each(tags, function (key, val) {
            manager.create(val, true);
        });
    };
    TagManager.prototype.create = function (rawTag, isImport) {
        var tag = $.trim(rawTag);
        if(!tag) {
            this.$element.val('');
            return;
        }
        if(this.options.initialCap) {
            tag = tag.charAt(0).toUpperCase() + tag.slice(1);
        }
        tag = this.options.validateHandler(this, tag, isImport);
        if(!tag) {
            this.$element.val('');
            return;
        }
        if(this.options.strategy = 'ajax' && this.options.ajaxCreate && !isImport) {
            $.ajax({
                url: this.options.ajaxCreate,
                type: 'post',
                data: {
                    tag: tag
                },
                dataType: 'json'
            });
        }
        if(this.options.createHandler) {
            this.options.createHandler(this, tag, isImport);
        }
        var id = 'tag_' + this.rack();
        this.tagIds.push(id);
        this.tagStrings.push(tag);
        var tagClass = new Tag(this, id, tag);
        this.options.createElementHandler(this, tagClass.render(), isImport);
        this.$element.val('');
        this.$element.focus();
    };
    TagManager.prototype.listen = function () {
        this.$element.on('keypress', $.proxy(this.keypress, this));
    };
    return TagManager;
})();
var Tag = (function () {
    function Tag(manager, id, value) {
        this.manager = manager;
        this.id = id;
        this.tag = value;
    }
    Tag.prototype.validate = function () {
        if(this.manager.options.strategy == 'array' && !this.manager.options.tagFieldName) {
            alert('Array strategy used with no field name');
        }
    };
    Tag.prototype.render = function () {
        this.validate();
        var tagHtml = $('<span />').addClass('tagmanagerTag').attr('tag', this.tag).attr('id', this.id).data('tagmanager', this.manager).text(this.tag);
        if(this.manager.options.strategy == 'array') {
            $('<input>').attr('type', 'hidden').attr('name', this.manager.options.tagFieldName).val(this.tag).appendTo(tagHtml);
        }
        var tagRemover = $('<a />').addClass('tagmanagerRemoveTag').attr('title', 'Remove').attr('href', '#').text('x').appendTo(tagHtml);
        var id = this.id;
        var manager = this.manager;
        $(tagRemover).click(function (e) {
            manager.delete(id);
            return false;
        });
        return tagHtml;
    };
    return Tag;
})();
$.fn.tagmanager = function (option) {
    return this.each(function () {
        var $this = $(this), data = $this.data('tagmanager'), options = typeof option == 'object' && option;
        if(!data) {
            $this.data('tagmanager', (data = new TagManager(this, options)));
        }
        if(typeof option == 'string') {
            data[option]();
        }
    });
};
