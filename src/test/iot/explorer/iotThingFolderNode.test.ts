/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'assert'
import { MoreResultsNode } from '../../../awsexplorer/moreResultsNode'
import { IotNode } from '../../../iot/explorer/iotNodes'
import { IotThingFolderNode } from '../../../iot/explorer/iotThingFolderNode'
import { IotThingNode } from '../../../iot/explorer/iotThingNode'
import { IotClient, IotThing } from '../../../shared/clients/iotClient'
import { Iot } from 'aws-sdk'
import { AWSTreeNodeBase } from '../../../shared/treeview/nodes/awsTreeNodeBase'
import { deepEqual, instance, mock, when } from '../../utilities/mockito'
import { TestSettings } from '../../utilities/testSettingsConfiguration'

describe('IotThingFolderNode', function () {
    const nextToken = 'nextToken'
    const maxResults = 150

    let iot: IotClient
    let config: TestSettings
    const thing: Iot.ThingAttribute = { thingName: 'thing', thingArn: 'arn' }
    const expectedThing: IotThing = { name: 'thing', arn: 'arn' }

    function assertThingNode(node: AWSTreeNodeBase, expectedThing: IotThing): void {
        assert.ok(node instanceof IotThingNode, `Node ${node} should be a Thing Node`)
        assert.deepStrictEqual((node as IotThingNode).thing, expectedThing)
    }

    function assertMoreResultsNode(node: AWSTreeNodeBase): void {
        assert.ok(node instanceof MoreResultsNode, `Node ${node} should be a More Results Node`)
    }

    beforeEach(function () {
        iot = mock()
        config = new TestSettings()
    })

    describe('getChildren', function () {
        it('gets children', async function () {
            when(iot.listThings(deepEqual({ nextToken: undefined, maxResults }))).thenResolve({
                things: [thing],
                nextToken: undefined,
            })

            await config.getSection('aws').update('iot.maxItemsPerPage', maxResults)
            const node = new IotThingFolderNode(instance(iot), new IotNode(instance(iot)), config)
            const [thingNode, ...otherNodes] = await node.getChildren()

            assertThingNode(thingNode, expectedThing)
            assert.strictEqual(otherNodes.length, 0)
        })

        it('gets children with node for loading more results', async function () {
            when(iot.listThings(deepEqual({ nextToken: undefined, maxResults }))).thenResolve({
                things: [thing],
                nextToken,
            })

            await config.getSection('aws').update('iot.maxItemsPerPage', maxResults)
            const node = new IotThingFolderNode(instance(iot), new IotNode(instance(iot)), config)
            const [thingNode, moreResultsNode, ...otherNodes] = await node.getChildren()

            assertThingNode(thingNode, expectedThing)
            assertMoreResultsNode(moreResultsNode)
            assert.strictEqual(otherNodes.length, 0)
        })
    })
})
