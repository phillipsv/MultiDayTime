(function($){
    /*
        notes
        put in limit
     */



    var MultiDayTime = function (element, options) {
        this.$element = $(element);
        if(!this.$element.is('div')) {
            $.error('Multidaytime should be applied to INPUT element');
            return;
        }
        this.options = $.extend({}, $.fn.multiDayTime.defaults, options, this.$element.data());
        this.main_container = "multidaytime-container";
        this.input_container_ul_class = "multidaytime-ul";
        this.input_container_li_class = "multidaytime-li";
        this.remove_li_class = "remove-li";
        this.select_day_class = "multidaytime-select-day";
        this.select_start_time_class = "multidaytime-select-time-start";
        this.select_end_time_class = "multidaytime-select-time-end";
        this.button_panel_class = "multidaytime-button-panel";
        this.button_panel_add_class="multidaytime-add-new";
        this.daysoftheweek = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
        this.init();
    };

    String.prototype.capitalizeFirstLetter = function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    };


    MultiDayTime.prototype = {
        constructor: MultiDayTime,
        init: function () {
            var _self = this;

            _self.$element.html("<div class='" +  _self.main_container + "'><div class='" +  _self.input_container_ul_class + "'></div><div" +
                " class='" +  _self.button_panel_class + "'></div></div>");

            if (_self.options.value) {
                $.each(_self.options.value, function (index, value) {
                    if(_self.validateDay(index)){
                        var ent = {};
                        ent.day = value.day;
                        if(_self.validateTime(value.start_time) && _self.validateTime(value.end_time)){
                            ent.start_time = value.start_time;
                            ent.end_time = value.end_time;
                            _self.drawInput(ent);
                        }
                        else{
                            return false;
                        }
                    }
                    else{
                        return false;
                    }
                });
            }

            _self.drawButtons();

            _self.$element.on("click", "." +  _self.button_panel_add_class, function () {
                _self.drawInput();

            });

            _self.$element.on("click", "." +  _self.remove_li_class, function () {
                //cleanup the timepicker plugin
                $(this).siblings("."+_self.select_start_time_class).timepicker("remove");
                $(this).siblings("."+_self.select_end_time_class).timepicker("remove");
                $(this).parent().remove();
            });

        },
        padZero: function(n, width) {
            var z = 0;
            width = width || 2;
            n  = n + '';
            return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
        },
        makeid: function (){
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for( var i=0; i < 5; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
        },

        drawInput: function (entry) {

            if(typeof entry === 'undefined'){
                entry = {};
                entry.day = '';
                entry.start_time = '';
                entry.end_time='';
            }

            //id for start and end strings to be used for timepicker, easier to instantiate.
            var start_id = "start_time_"+this.makeid();
            var end_id = "end_time_"+this.makeid();

            this.$element.find("." + this.input_container_ul_class).append("<div class='" + this.input_container_li_class + "'>" +
                this.generateDaySelect(entry.day) +
                "<input type='text' id='" + start_id + "' class='" + this.select_start_time_class + "' "+
                " value='"+entry.start_time+"'/> - " +
                "<input id='" + end_id + "' type='text' class='" + this.select_end_time_class + "' "+
                " value='"+entry.end_time+"'/>" +
                "<span class='" + this.remove_li_class + "'><a href='#'>Remove</a></span></div>");

            //instantiate time picker for the input boxes.
            this.invokeTimepicker(start_id);
            this.invokeTimepicker(end_id);

        },
        invokeTimepicker: function(id){
            $("#"+id).timepicker();
        },
        drawButtons: function () {
            this.$element.find("." + this.button_panel_class).append("<a href='#' class='" + this.button_panel_add_class + "'>"+this.options.addLang+"</a>");
        },

        validateTime: function(time){
            return /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/.test(time);
        },

        validateDay: function(day){
            return $.inArray(day,this.daysoftheweek);
        },

        generateDaySelect: function(day){
            day = (day == '') ? "sunday" : day;

            var select = "<select class='" + this.select_day_class + "'>";
            $.each(this.daysoftheweek, function(index,value){
                if(day.toUpperCase() == value.toUpperCase())
                    select += "<option value='"+value+"' selected>"+value.capitalizeFirstLetter()+"</option>";
                 else
                    select += "<option value='"+value+"'>"+value.capitalizeFirstLetter()+"</option>";
            });
            select += "</select>";
            return select;
        },

        normalizeArray: function(obj) {
            var narr =[];
            $.each(obj, function (index, value) {
                var tmp = {};
                tmp.day = index;
                $.each(value, function(x, y){
                    tmp.start_time = y.start_time;
                    tmp.end_time = y.end_time;
                    narr.push(tmp);
                });
            });
            return narr;
        },

        getResult: function () {
            var obj = {},
                _self = this;
                error_message = "";

            if (_self.$element.find("." +  _self.input_container_li_class).length) {

                $.each(_self.$element.find("." +  _self.input_container_li_class), function () {

                    var tmp = {},
                        day = $.trim($(this).children("." +  _self.select_day_class).eq(0).val());

                    start_time_obj = $(this).children("." +  _self.select_start_time_class).eq(0).timepicker("getTime");
                    end_time_obj = $(this).children("." +  _self.select_end_time_class).eq(0).timepicker("getTime");

                    if(!start_time_obj || !end_time_obj){
                        error_message = "Invalid time values";
                        return false;
                    }

                    tmp.start_time = _self.padZero( start_time_obj.getHours() )+":"+ _self.padZero(start_time_obj.getMinutes())+":"+ _self.padZero(start_time_obj.getSeconds());
                    tmp.end_time =  _self.padZero(end_time_obj.getHours())+":"+ _self.padZero(end_time_obj.getMinutes())+":"+ _self.padZero(end_time_obj.getSeconds());


                    if(tmp.start_time >= tmp.end_time){
                        error_message = "The end time should be greater than the start";
                        return false;
                    }

                    if (day in obj) {
                        //get all the times for the day to test for overlap
                        $.each(obj[day], function (index, value) {
                            if ((tmp.start_time >= value.start_time && tmp.start_time <= value.end_time) || (tmp.end_time >= value.start_time && tmp.end_time <= value.end_time)) {
                                error_message = "Overlap exists";
                                return false;
                            }
                        });
                    }
                    else {
                        obj[day] = [];
                    }

                    obj[day].push(tmp);

                });
            }

            return error_message !== '' ? error_message : _self.normalizeArray(obj);
        }
    }

    $.fn.multiDayTime = function (option, param) {
        var value
            , args = [];

        Array.prototype.push.apply( args, arguments );

        var elements = this.each(function () {
            var $this = $(this)
                , data = $this.data('multidaytime')
                , options = typeof option == 'object' && option

            if (typeof option === 'string' && data && data[option]) {
                args.shift()
                value = data[option].apply(data, args)
            } else {
                if (!data && typeof option !== 'string' && !param) {
                    $this.data('multidaytime', (data = new MultiDayTime(this, options)));
                }
            }
        })

        return typeof value !== 'undefined' ? value : elements;
    }

    $.fn.multiDayTime.defaults = {
        value: null,
        addLang: 'Add'
    };

})(jQuery);