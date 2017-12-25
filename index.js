class Autocompleter {
    constructor(settings) {
        // Settings example
        // {
        //      elm: $('.hello'),
        //      url: '/api/campaigns/',
        //      template: '<div><span><img src="__brand__?size=80x80" style="width: 40px"/></span> __name__</div>',
        //.     onClick: () => {console.log('hello')}
        // }

        this.settings = settings;
        this.settings.identifier =
            '_autocompleter_' + new Date().getTime().toString();

        jQuery.ui.autocomplete.prototype._resizeMenu = function() {
            var ul = this.menu.element;

            var outerElm = settings.align_to || this.element;
            ul.outerWidth(outerElm.outerWidth());
        };

        $('head').append(
            '<style type="text/css">._autocompleter .ui-state-active {background-color: rgba(0,0,0,0.1)!important}</style>'
        );

        this.init();
    }

    constructTemplate(item) {
        let template = (' ' + this.settings.template).slice(1);

        $.each(item, (key, value) => {
            template = template.replace(
                new RegExp('{' + key + '}', 'g'),
                value
            );
        });

        return template;
    }

    constructLink(item) {
        let link = (' ' + this.settings.onClick).slice(1);

        $.each(item, (key, value) => {
            link = link.replace(new RegExp('{' + key + '}', 'g'), value);
        });

        return link;
    }

    getVariables(template, onClick, data) {
        const dirty_vars = template.match(/{([\s\S]*?)}/g);
        let onclick_dirty_vars = [];

        if (typeof onClick === 'string') {
            onclick_dirty_vars = onClick.match(/{([\s\S]*?)}/g);
        }

        let variables = {};

        $.each(dirty_vars, (key, value) => {
            let k = value.replace(/{/g, '');
            k = k.replace(/}/g, '');
            variables[k] = data[k];
        });

        $.each(onclick_dirty_vars, (key, value) => {
            let k = value.replace(/{/g, '');
            k = k.replace(/}/g, '');
            variables[k] = data[k];
        });

        return variables;
    }

    init() {
        const url = this.settings.url;
        const getVariables = this.getVariables;
        const template = this.settings.template;
        const elm = this.settings.elm;
        const onClick = this.settings.onClick;
        const identifier = this.settings.identifier;

        elm.autocomplete({
            source: function(request, response) {
                $.getJSON(url, { search: request.term }, rsp => {
                    const results = rsp.results;

                    var variables = getVariables(template, onClick, results);

                    let formatted_data = [];

                    $.each(results, (key, value) => {
                        let obj = {};
                        $.each(variables, (var_key, var_value) => {
                            try {
                                obj[var_key] = eval('value.' + var_key);
                            } catch (err) {
                                console.log(err);
                            }
                        });
                        obj.label = '';
                        obj.value = '';
                        obj._autocompleter_id = key;
                        formatted_data.push(obj);
                    });

                    response(formatted_data);
                });
            },
            minLength: 2,
            messages: {
                noResults: '',
                results: function() {}
            },
            select: function(event, ui) {
                const item = ui.item;

                if (typeof onClick === 'function') {
                    onClick(item);
                } else {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        const element = $(
                            '#' + identifier + ' .ui-menu-item'
                        ).eq(parseInt(ui.item._autocompleter_id));
                        const anchor = element.find('a');
                        window.top.location.href =
                            window.top.location.origin + anchor.attr('href');
                    }
                }
            }
        });

        this.settings.elm.autocomplete('instance')._renderItem = (ul, item) => {
            let template = this.constructTemplate(item);

            ul.attr('id', this.settings.identifier);

            $(ul).css({
                'list-style-type': 'none!important',
                'padding-left': 'inherit',
                'background-color': 'white',
                'box-shadow': '0px 2px 7px rgba(0,0,0,0.3)',
                'z-index': '99999',
                position: 'absolute'
            });

            const liCss = {
                'border-top': '1px solid rgba(0,0,0,0.1)',
                position: 'relative',
                cursor: 'pointer',
                'list-style-type': 'none'
            };

            if (typeof this.settings.onClick === 'string')
                template =
                    '<a style="display: block;" href="' +
                    this.constructLink(item) +
                    '">' +
                    template +
                    '</a>';

            return $('<li>')
                .addClass('_autocompleter')
                .append(template)
                .css(liCss)
                .appendTo(ul);
        };
    }
}

export default Autocompleter;
