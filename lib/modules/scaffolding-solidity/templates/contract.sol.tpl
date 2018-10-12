pragma solidity ^0.4.24;

contract {{contractName}} {

    struct {{structName}} {
{{#each fields}}
        {{type}} {{name}};
{{/each}}
    }

    {{structName}}[] public items;

    event ItemCreated(uint id, address createdBy);
    event ItemDeleted(uint id, address deletedBy);
    event ItemUpdated(uint id, address updatedBy);

    function add({{#each fields}}{{type}} _{{name}}{{#unless @last}}, {{/unless}}{{/each}}) public {
        uint id = items.length++;
        items[id] = {{structName}}({
        {{#each fields}}
            {{name}}: _{{name}}{{#unless @last}},{{/unless}}
        {{/each}}
        });

        emit ItemCreated(id, msg.sender);
    }

    function edit(uint _id, {{#each fields}}{{type}} _{{name}}{{#unless @last}}, {{/unless}}{{/each}}) public {
        require(_id < items.length, "Invalid {{structName}} id");

        {{#each fields}}
        items[_id].{{name}} = _{{name}};
        {{/each}}

        emit ItemUpdated(_id, msg.sender);
    }

    function remove(uint _id) public {
        require(_id < items.length, "Invalid {{structName}} id");

        delete items[_id];
        emit ItemDeleted(_id, msg.sender);
    }

}
