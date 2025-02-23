<!--
    This module focuses on the clickable box that represents a specific service/feature
    on the left side of the screen. It defines the base structure of the component and
    from there specific service item components can be defined.

    Additionaly, this module provides a state manager to keep track of the state of
    of the service items.
 -->
<template>
    <li :class="[classWhenIsSelected, 'service-item-container', 'border-common']" v-on:mousedown="serviceItemClicked">
        <!-- The icon -->
        <div class="icon-item" :class="serviceIconClass"></div>

        <!-- The text info -->
        <div class="text-info-container">
            <div class="service-item-title">
                {{ title }}
            </div>
            <div class="service-item-description sub-text-color">
                {{ description }}
            </div>
        </div>
    </li>

    <li class="service-item-content-list-item">
        <!-- See 'Named Slots' for more info -->
        <slot name="service-item-content-slot"></slot>
    </li>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { ServiceItemId } from './types'

/* The status of the icon for a service */
type ServiceIconStatus = keyof typeof serviceIconClasses

/* The general status of the service */
export type ServiceStatus = Exclude<ServiceIconStatus, 'LOCKED_SELECTED'>

/**
 * Maps a service status to the CSS classes that will create the icon.
 *
 * LOCKED_SELECTED is a case where the item is locked but selected by the user.
 */
const serviceIconClasses = {
    LOCKED: 'icon icon-lg icon-vscode-lock',
    LOCKED_SELECTED: 'icon icon-lg icon-vscode-lock locked-selected',
    UNLOCKED: 'icon icon-lg icon-vscode-check unlocked',
} as const

/**
 * The static props that are expected to be passed to a ServiceItem component.
 *
 * Static here implies that these props are not expected to change after the component is created.
 */
export interface StaticServiceItemProps {
    title: string
    description: string
}

/**
 * The base component for a service item that should be extended
 * by specific service item components.
 */
export default defineComponent({
    name: 'ServiceItem',
    components: {},
    emits: ['service-item-clicked'],
    props: {
        id: {
            type: String as PropType<ServiceItemId>,
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        status: {
            type: String as PropType<ServiceStatus>,
            default: 'LOCKED',
        },
        isSelected: {
            type: Boolean,
            default: false,
        },
        isLandscape: {
            type: Boolean,
            required: true,
            description: 'Whether the screen is in landscape mode or not.',
        },
    },
    data() {
        return {
            classWhenIsSelected: '',
            serviceIconClasses: serviceIconClasses,
            serviceIconClass: '',
        }
    },
    created() {
        // The CSS class that should be applied to the container when the item is selected.
        this.classWhenIsSelected = this.isSelected ? 'service-item-container-selected' : ''

        // The CSS class that determines which icon to show.
        const serviceIconStatus: ServiceIconStatus =
            this.isSelected && this.status === 'LOCKED' ? 'LOCKED_SELECTED' : this.status
        this.serviceIconClass = this.serviceIconClasses[serviceIconStatus]
    },
    methods: {
        serviceItemClicked() {
            this.$emit('service-item-clicked', this.id)
        },
    },
})

/**
 * ------------------- Service Item Implementations -------------------
 *
 * All specific service item components should be defined below.
 */

/**
 * A Service Item ID is the main identifier/representation of a specific service item.
 */

const staticServiceItemProps: Readonly<Record<ServiceItemId, { title: string; description: string }>> = {
    codewhisperer: {
        title: 'CodeWhisperer: AI-powered code suggestions',
        description: 'Build applications faster with your AI coding companion.',
    },
    awsExplorer: {
        title: 'AWS Explorer: View, modify, and deploy AWS Resources',
        description: 'Work with S3, CloudWatch, and more.',
    },
    codecatalyst: {
        title: 'CodeCatalyst: Launch CodeCatalyst Dev Environments',
        description: 'Spend more time coding and less time managing development environments.',
    },
}

/* -------------------------------------- */

/**
 * This class is responsible for keeping track of the state of all service items.
 *
 * As the user interacts with the service items, certain methods of this class
 * can be used to update the state of specific service items. Then, the method
 * {@link getServiceIds} can be used to get the latest state of all service items.
 */
export class ServiceItemsState {
    /**
     * IDs of all services that are currently unlocked
     *
     * Note the default unlocked service(s) are pre-defined here.
     */
    private readonly unlockedServices: Set<ServiceItemId> = new Set([])

    private currentlySelected?: ServiceItemId = undefined

    /**
     * The Ids of the service items, separated by the ones that are locked vs. unlocked
     *
     * IMPORTANT: This is the source of truth of the current state of all service items.
     *            Use the methods of this class to modify the states of items, then use
     *            this method to get the latest state.
     */
    getServiceIds(): { unlocked: ServiceItemId[]; locked: ServiceItemId[] } {
        const allServiceIds = Object.keys(staticServiceItemProps) as ServiceItemId[]
        const unlockedConstructorIds = allServiceIds.filter(id => this.unlockedServices.has(id))
        const lockedConstructorIds = allServiceIds.filter(id => !this.unlockedServices.has(id))

        return {
            unlocked: unlockedConstructorIds,
            locked: lockedConstructorIds,
        }
    }

    /**
     * Static Service Item props are the props that are not expected to change
     * after the component is created.
     */
    getStaticServiceItemProps(id: ServiceItemId): StaticServiceItemProps {
        return staticServiceItemProps[id]
    }

    /** The currently selected service item */
    get selected(): ServiceItemId | undefined {
        return this.currentlySelected
    }

    /** Marks the item as selected by the user */
    select(id: ServiceItemId) {
        this.currentlySelected = id
    }

    deselect() {
        this.currentlySelected = undefined
    }

    toggleSelected(id: ServiceItemId) {
        if (this.currentlySelected === id) {
            this.deselect()
        } else {
            this.select(id)
        }
    }

    /** Marks the item as being 'unlocked', implying the required auth is completed. */
    unlock(id: ServiceItemId) {
        this.unlockedServices.add(id)
    }

    /** Marks the item as being 'locked', implying the required auth is NOT completed. */
    lock(id: ServiceItemId) {
        this.unlockedServices.delete(id)
    }
}
</script>

<style>
@import './shared.css';

/* ******** Container ******** */

.service-item-container {
    background-color: var(--vscode-sideBar-background);
    display: flex;
    margin-top: 10px;
    padding: 20px 15px 20px 15px;

    min-height: 35px;

    /* Icon and text are centered on the secondary axis */
    align-items: center;

    cursor: pointer;
}

/* When a service item was clicked */
.service-item-container-selected {
    background-color: var(--vscode-sideBar-border);
    border-color: var(--vscode-button-background);
}

/* ******** Icon ******** */
.icon-item {
    /* Separation between icon and text */
    margin-right: 15px;
}

/* The checkmark symbol */
.unlocked {
    color: var(--vscode-charts-green);
}

/* The lock symbol but the user has clicked it */
.locked-selected {
    color: var(--vscode-button-background);
}

/* ******** Text ******** */

.service-item-title {
    font-size: 13px;
    font-weight: 800;
    font-family: 'Verdana';
    line-height: 16px;
    margin-bottom: 5px;
    margin-top: 0;
}

.service-item-description {
    font-size: 12px;
    font-weight: 500;
    font-family: 'Verdana';
    line-height: 14px;
    margin-bottom: 0;
    margin-top: 0;
}

.text-info-container {
    display: flex;
    flex-direction: column;
    text-align: left;
    user-select: none;
}

/* ******** Service Item Content Container ******** */

.service-item-content-list-item:empty {
    display: none;
}
</style>
