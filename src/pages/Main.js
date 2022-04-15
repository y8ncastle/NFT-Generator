/* eslint-disable */
import {
  Grid,
  Container,
  Typography,
  CardContent,
  Card,
  Button,
  TextField,
  Modal,
  Backdrop,
  Fade,
  Box,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import Web3 from 'web3';
import * as bip39 from 'bip39';
import hdkey from 'ethereumjs-wallet/dist/hdkey';
import Tx from 'ethereumjs-tx';
import IPFS from 'ipfs-api';
import { abi } from '../common/abi';
import img from '../image/nft.jpg';
import qr from '../image/upload_qr.png';
import android from '../image/android.png';
import apple from '../image/apple.png';
import rotate from '../image/rotate.gif';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '60%',
  bgcolor: 'background.paper',
  border: '5px solid #ffffff',
  borderRadius: '24px',
  boxShadow: 24,
  p: 4,
};

const modalStyle2 = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '30%',
  color: '#333333',
  bgcolor: '#ffffff',
  border: '10px solid #ffffff',
  borderRadius: '24px',
  boxShadow: 24,
  p: 4,
};

export default function Main() {
  const web3 = new Web3(
    new Web3.providers.HttpProvider(`https://ropsten.infura.io/v3/${process.env.REACT_APP_INFURA}`)
  );

  const [balance, setBalance] = useState('0');
  const [mnemonic, setMnemonic] = useState('');
  const [publicAdr, setPublicAdr] = useState('-');
  const [revealed, setRevealed] = useState(true);
  const fileSelect = useRef('');
  const [fileName, setFileName] = useState(
    'QR 버튼을 누른 후 구글 폼을 통해 이미지를 먼저 제출해주세요. 해당 파일을 이용해 IPFS에 업로드 한 후 결과가 출력되는 자리입니다.'
  );
  const [ipfsLink, setIpfsLink] = useState('');
  const [open, setOpen] = useState(false);
  const [nftAdr, setNftAdr] = useState('');
  const [load, setLoad] = useState(false);

  useEffect(async () => {
    const balCheck = await web3.eth.getBalance(process.env.REACT_APP_MA);

    setBalance(web3.utils.fromWei(balCheck, 'ether'));
  }, []);

  const toggleRevealed = () => {
    if (revealed) setRevealed(false);
    else setRevealed(true);
  };

  const handleFile = () => {
    fileSelect.current.click();
  };

  const handleQrModal = () => {
    setOpen(!open);
  };

  const handleLoadModal = () => {
    setLoad(!load);
  };

  const handleUpload = (event) => {
    const file = event.target.files[0];
    const reader = new window.FileReader();

    reader.readAsArrayBuffer(file);
    reader.onloadend = () => {
      uploadToIPFS(Buffer(reader.result, 'utf8'));
    };
  };

  const resetHolder = (type) => {
    switch (type) {
      case '1':
        setMnemonic('');
        setPublicAdr('-');
        break;
      case '2':
        setIpfsLink('');
        setFileName(
          'QR 버튼을 누른 후 구글 폼을 통해 이미지를 먼저 제출해주세요. 해당 파일을 이용해 IPFS에 업로드 한 후 결과가 출력되는 자리입니다.'
        );
        break;
      case '3':
        setNftAdr('');
        break;
      default:
    }
  };

  const generateMnemonic = async () => {
    const genMnemonic = bip39.generateMnemonic();

    setMnemonic(genMnemonic);

    const seed = await bip39.mnemonicToSeed(genMnemonic);
    const hdwallet = hdkey.fromMasterSeed(seed);
    const path = "m/44'/60'/0'/0/0";
    const wallet = hdwallet.derivePath(path).getWallet();
    const address = `0x${wallet.getAddress().toString('hex')}`;

    setPublicAdr(address);
  };

  const uploadToIPFS = (reader) => {
    const ipfs = IPFS('ipfs.infura.io', '5001', { protocol: 'https' });

    ipfs.add(reader, (error, result) => {
      setIpfsLink(`https://ipfs.infura.io/ipfs/${result[0].hash}`);

      if (error) console.log(error);
    });
  };

  const makeNFT = async () => {
    if (publicAdr !== '-') {
      try {
        handleLoadModal();

        const contract = new web3.eth.Contract(abi, process.env.REACT_APP_CA);
        const txCount = await web3.eth.getTransactionCount(process.env.REACT_APP_MA);
        const gasPrice = await web3.eth.getGasPrice();

        const rawTx = {
          nonce: web3.utils.toHex(txCount),
          from: process.env.REACT_APP_MA,
          to: process.env.REACT_APP_CA,
          gasPrice: web3.utils.toHex(gasPrice),
          gasLimit: web3.utils.toHex(3000000),
          data: contract.methods.genNew(ipfsLink, publicAdr).encodeABI(),
        };

        const tx = new Tx(rawTx, { chain: 'ropsten' });
        const privKey = new Buffer.from(process.env.REACT_APP_MA_PRV.substring(2), 'hex');
        tx.sign(privKey);

        const serializedTx = `0x${tx.serialize().toString('hex')}`;
        await web3.eth
          .sendSignedTransaction(serializedTx.toString('hex'))
          .once('transactionHash', function (hash) {
            setNftAdr(`https://ropsten.etherscan.io/tx/${hash}`);
          })
          .on('confirmation', function (receipt) {
            console.log(receipt);
            alert('NFT 발행이 완료되었습니다.');
            handleLoadModal();
          })
          .on('error', function (error) {
            console.log(error);
            alert('블록체인 기록에 실패했습니다.');
            handleLoadModal();
          });
      } catch (err) {
        alert(err);
      }
    } else alert('먼저 지갑을 생성해주세요.');
  };

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 3.5, color: '#333333' }}>
        Ethereum Wallet and NFT Generator
      </Typography>

      <Grid container spacing={12} sx={{ mb: 6 }}>
        <Grid item xs={12} md={6} lg={5.5}>
          <img src={img} alt="NFT" width="100%" />
        </Grid>
        <Grid item xs={12} md={6} lg={6} sx={{ ml: 5 }}>
          <h1>블록체인 지갑과 나만의 NFT를 만들어보세요!</h1>
          <Typography sx={{ mt: 3, fontSize: 20 }}>
            간편한 절차로 이더리움 계정을 만들어 드립니다.
          </Typography>
          <Typography sx={{ mt: 2, fontSize: 20 }}>
            또한, 이더리움 테스트넷 상에 당신의 이미지를 NFT로 만들어 드립니다.
          </Typography>
          <Typography sx={{ mt: 2, fontSize: 20 }}>
            자신만의 이미지를 블록체인 위에 영구히 기록해보세요.
          </Typography>
          <Typography sx={{ mt: 14 }}>
            * 마스터 지갑 주소: &nbsp;
            <strong>{process.env.REACT_APP_MA}</strong>
          </Typography>
          <Typography sx={{ mt: 2 }}>
            * 마스터 지갑 남은 ETH: &nbsp;
            <strong>{balance} ETH</strong>
          </Typography>
          <Typography sx={{ mt: 2 }}>
            * 생성된 지갑 주소: &nbsp;
            <strong>{publicAdr}</strong>
          </Typography>
        </Grid>
      </Grid>

      <Grid container spacing={12}>
        <Grid item xs={12} md={6} lg={4}>
          <Card sx={{ height: 350 }}>
            <CardContent>
              <h2>지갑 니모닉</h2>
              {revealed === true ? (
                <TextField
                  sx={{ mt: 2, width: '100%' }}
                  rows={6}
                  multiline
                  placeholder="지갑 복구를 위한 개인키(니모닉)가 생성되는 자리입니다."
                  value={mnemonic}
                  disabled
                />
              ) : (
                <TextField
                  sx={{ mt: 2, width: '100%' }}
                  rows={6}
                  multiline
                  placeholder="*******************************************"
                  value=""
                  disabled
                />
              )}
              <Button
                sx={{
                  mt: 3,
                  width: '50%',
                  fontSize: 16,
                  backgroundColor: '#ba0000',
                  color: '#ffffff',
                }}
                variant="contained"
                size="large"
                color="error"
                onClick={() => generateMnemonic()}
              >
                지갑 생성
              </Button>
              <Button
                sx={{ mt: 3, width: '25%', fontSize: 16 }}
                variant="contained"
                size="large"
                color="inherit"
                onClick={toggleRevealed}
              >
                {revealed === true ? '비공개' : '공개'}
              </Button>
              <Button
                sx={{ mt: 3, width: '25%', fontSize: 16 }}
                variant="contained"
                size="large"
                color="inherit"
                onClick={() => resetHolder('1')}
              >
                초기화
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <Card sx={{ height: 350 }}>
            <CardContent>
              <h2>이미지 업로드</h2>
              <div>
                <TextField
                  sx={{ mt: 2, width: '100%' }}
                  rows={6}
                  multiline
                  placeholder={fileName}
                  value={ipfsLink}
                  disabled
                />
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/gif"
                  ref={fileSelect}
                  onChange={(e) => handleUpload(e)}
                  style={{ display: 'none' }}
                />
                <Button
                  sx={{
                    mt: 3,
                    width: '50%',
                    fontSize: 16,
                    backgroundColor: '#339966',
                    color: '#ffffff',
                  }}
                  variant="contained"
                  size="large"
                  color="success"
                  onClick={() => handleFile()}
                >
                  IPFS 업로드
                </Button>
                <Button
                  sx={{ mt: 3, width: '25%', fontSize: 16 }}
                  variant="contained"
                  size="large"
                  color="inherit"
                  onClick={() => handleQrModal()}
                >
                  QR
                </Button>
                <Button
                  sx={{ mt: 3, width: '25%', fontSize: 16 }}
                  variant="contained"
                  size="large"
                  color="inherit"
                  onClick={() => resetHolder('2')}
                >
                  초기화
                </Button>
              </div>
            </CardContent>
          </Card>
        </Grid>

        <Modal
          open={open}
          onClose={handleQrModal}
          closeAfterTransition
          BackdropProps={{ timeout: 500 }}
          BackdropComponent={Backdrop}
        >
          <Fade in={open}>
            <Box sx={modalStyle}>
              <h2>
                NFT로 만들 이미지 업로드 또는 메타마스크(Metamask) 지갑 설치를 위해 QR 코드를
                스캔해주세요.
              </h2>
              <br />
              <br />

              <Grid
                container
                spacing={12}
                sx={{
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Grid item xs={12} md={3}>
                  <img src={qr} alt="scan" />
                </Grid>
                <Grid item xs={12} md={3}>
                  <img src={android} alt="android" />
                </Grid>
                <Grid item xs={12} md={3}>
                  <img src={apple} alt="apple" />
                </Grid>
              </Grid>

              <Grid
                container
                spacing={12}
                sx={{
                  justifyContent: 'center',
                  justifyItems: 'center',
                }}
              >
                <Grid item xs={4} md={3} sx={{ mt: 2 }}>
                  <h3>이미지 업로드를 위한 QR 코드 (구글 폼)</h3>
                </Grid>
                <Grid item xs={12} md={3} sx={{ mt: 2 }}>
                  <h3>안드로이드 메타마스크 (플레이 스토어)</h3>
                </Grid>
                <Grid item xs={12} md={3} sx={{ mt: 2 }}>
                  <h3>아이폰(Apple) 메타마스크 (앱 스토어)</h3>
                </Grid>
              </Grid>
            </Box>
          </Fade>
        </Modal>

        <Grid item xs={12} md={6} lg={4}>
          <Card sx={{ height: 350 }}>
            <CardContent>
              <h2>NFT 생성 결과</h2>
              <TextField
                sx={{ mt: 2, width: '100%' }}
                rows={6}
                multiline
                placeholder="NFT 생성 이후 트랜잭션 해시가 반환되는 자리입니다."
                value={nftAdr}
                disabled
              />
              <Button
                sx={{ mt: 3, width: '75%', fontSize: 16 }}
                variant="contained"
                size="large"
                onClick={() => makeNFT()}
              >
                NFT 발행
              </Button>
              <Button
                sx={{ mt: 3, width: '25%', fontSize: 16 }}
                variant="contained"
                size="large"
                color="inherit"
                onClick={() => resetHolder('3')}
              >
                초기화
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Modal
        open={load}
        onClose={handleLoadModal}
        closeAfterTransition
        disableEscapeKeyDown
        BackdropProps={{ timeout: 500 }}
        BackdropComponent={Backdrop}
      >
        <Fade in={load}>
          <Box sx={modalStyle2}>
            <Grid
              container
              spacing={12}
              sx={{
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Grid item xs={12} md={3}>
                <img src={rotate} alt="rotate" />
              </Grid>
            </Grid>

            <br />
            <Grid
              container
              spacing={12}
              sx={{
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Grid item xs={12} md={6} sx={{ mt: 2, ml: 3 }}>
                <h2>
                  블록체인에 기록중입니다. <br />
                  (NFT 발행, 최대 1~2분 소요)
                </h2>
              </Grid>
            </Grid>
          </Box>
        </Fade>
      </Modal>
    </Container>
  );
}
