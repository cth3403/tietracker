import React from 'react';
import {useSelector} from 'react-redux';

import {IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle} from '@ionic/react';

import styles from './Summary.module.scss';

import {rootConnector} from '../../store/thunks/index.thunks';
import {RootState} from '../../store/reducers';

import {Summary as SummaryData} from '../../store/interfaces/summary';

import {formatCurrency} from '../../utils/utils.currency';
import {formatTime} from '../../utils/utils.time';

const Summary: React.FC = () => {

    const summary: SummaryData | undefined = useSelector((state: RootState) => state.summary.summary);

    return (<div className="ion-padding-end ion-padding-top">
        <h1 className={styles.title}>Weekly Summary</h1>
        <IonCard className={styles.card}>
            <IonCardHeader>
                <IonCardSubtitle className={styles.subtitle}>Tracked: {formatTime(summary !== undefined ? summary.milliseconds : undefined)}</IonCardSubtitle>
                <IonCardTitle>Billable: {formatCurrency(summary !== undefined ? summary.billable : undefined)}</IonCardTitle>
            </IonCardHeader>
        </IonCard>
    </div>);
};

export default rootConnector(Summary);
